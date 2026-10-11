
package com.nexusguard;

import io.javalin.Javalin;

import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class Main {

    private static final String DB_URL =
            System.getenv().getOrDefault(
                    "DB_URL",
                    "jdbc:postgresql://localhost:5432/nexus_guard"
            );

    private static final String DB_USER =
            System.getenv().getOrDefault("DB_USER", "postgres");

    private static String getDbPassword() {
        return System.getenv("DB_PASSWORD");
    }

    private static Connection getConnection() throws SQLException {
        String password = getDbPassword();

        if (password == null || password.isBlank()) {
            throw new SQLException(
                    "DB_PASSWORD environment variable is not set."
            );
        }

        return DriverManager.getConnection(DB_URL, DB_USER, password);
    }

    private static Map<String, Object> mapProduct(ResultSet rs)
            throws SQLException {

        Map<String, Object> product = new LinkedHashMap<>();
        product.put("id", rs.getInt("id"));
        product.put("name", rs.getString("name"));
        product.put("category", rs.getString("category"));
        product.put("price", rs.getBigDecimal("price"));
        product.put("stock_quantity", rs.getInt("stock_quantity"));
        product.put("reorder_level", rs.getInt("reorder_level"));

        return product;
    }

    private static List<Map<String, Object>> fetchProducts(
            boolean lowStockOnly) throws SQLException {

        String sql = """
                SELECT id, name, category, price,
                       stock_quantity, reorder_level
                FROM products
                """
                + (lowStockOnly
                    ? " WHERE stock_quantity <= reorder_level "
                    : "")
                + " ORDER BY id";

        List<Map<String, Object>> products = new ArrayList<>();

        try (Connection connection = getConnection();
             PreparedStatement statement =
                     connection.prepareStatement(sql);
             ResultSet rs = statement.executeQuery()) {

            while (rs.next()) {
                products.add(mapProduct(rs));
            }
        }

        return products;
    }

    public static void main(String[] args) {

        int port = Integer.parseInt(
                System.getenv().getOrDefault("PORT", "7070")
        );
                
        KafkaEventConsumer transactionConsumer =
                new KafkaEventConsumer(
                        "transaction-events",
                        "nexus-guard-transactions"
                );

        KafkaEventConsumer fraudAlertConsumer =
                new KafkaEventConsumer(
                        "fraud-alerts",
                        "nexus-guard-fraud-alerts"
                );

        Thread transactionConsumerThread =
                new Thread(transactionConsumer, "transaction-consumer");

        Thread fraudAlertConsumerThread =
                new Thread(fraudAlertConsumer, "fraud-alert-consumer");

        transactionConsumerThread.setDaemon(true);
        fraudAlertConsumerThread.setDaemon(true);

        transactionConsumerThread.start();
        fraudAlertConsumerThread.start();

        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            transactionConsumer.stop();
            fraudAlertConsumer.stop();
            KafkaEventProducer.close();
        }));


        Javalin app = Javalin.create(config -> {
            config.bundledPlugins.enableCors(cors -> {
                cors.addRule(rule -> rule.anyHost());
            });
        });

        app.get("/", ctx -> {
            ctx.result("NEXUS GUARD Java API");
        });

        app.put("/api/products/{id}", ctx -> {
            int id;

            try {
                id = Integer.parseInt(ctx.pathParam("id"));
            } catch (NumberFormatException e) {
                ctx.status(400).json(Map.of("error", "Invalid product ID"));
                return;
            }

            Map<String, Object> body = ctx.bodyAsClass(Map.class);

            try {
                String name = String.valueOf(body.getOrDefault("name", "")).trim();
                String category = String.valueOf(
                    body.getOrDefault("category", "")
                ).trim();

                if (name.isEmpty()) {
                    ctx.status(400).json(Map.of("error", "Product name is required"));
                    return;
                }

                BigDecimal price = new BigDecimal(body.get("price").toString());
                int stock = Integer.parseInt(body.get("stock_quantity").toString());
                int reorder = Integer.parseInt(body.get("reorder_level").toString());

                if (price.signum() < 0 || stock < 0 || reorder < 0) {
                    ctx.status(400).json(Map.of(
                        "error", "Price and quantities cannot be negative"
                    ));
                    return;
                }

                String sql = """
                    UPDATE products
                    SET name = ?, category = ?, price = ?,
                        stock_quantity = ?, reorder_level = ?
                    WHERE id = ?
                    RETURNING id, name, category, price,
                              stock_quantity, reorder_level
                    """;

                try (Connection conn = getConnection();
                     PreparedStatement stmt = conn.prepareStatement(sql)) {

                    stmt.setString(1, name);
                    stmt.setString(2, category.isEmpty() ? null : category);
                    stmt.setBigDecimal(3, price);
                    stmt.setInt(4, stock);
                    stmt.setInt(5, reorder);
                    stmt.setInt(6, id);

                    try (ResultSet rs = stmt.executeQuery()) {
                        if (rs.next()) {
                            ctx.json(mapProduct(rs));
                        } else {
                            ctx.status(404).json(Map.of(
                                "error", "Product not found"
                            ));
                        }
                    }
                }
            } catch (NumberFormatException | NullPointerException e) {
                ctx.status(400).json(Map.of(
                    "error", "Enter valid price and quantity values"
                ));
            } catch (SQLException e) {
                e.printStackTrace();
                ctx.status(500).json(Map.of(
                    "error", "Could not update product"
                ));
            }
        });

        app.get("/api/health", ctx -> {
            ctx.json(Map.of(
                    "status", "UP",
                    "application", "NEXUS GUARD API",
                    "message", "Java backend is running"
            ));
        });

        app.get("/api/products", ctx -> {
            try {
                ctx.json(fetchProducts(false));
            } catch (SQLException e) {
                System.err.println(
                        "Database error while fetching products: "
                                + e.getMessage()
                );
                ctx.status(500);
                ctx.json(Map.of(
                        "error", "Unable to retrieve products.",
                        "hint", "Check the database connection settings."
                ));
            }
        });

        app.post("/api/products", ctx -> {
            Map<String, Object> body = ctx.bodyAsClass(Map.class);

            String name = body.get("name") == null
                    ? "" : body.get("name").toString().trim();

            String category = body.get("category") == null
                    ? "" : body.get("category").toString().trim();

            if (name.isEmpty()) {
                ctx.status(400).json(
                    Map.of("error", "Product name is required")
                );
                return;
            }

            try {
                java.math.BigDecimal price =
                    new java.math.BigDecimal(body.get("price").toString());

                int stock = Integer.parseInt(
                    body.get("stock_quantity").toString()
                );

                int reorderLevel = Integer.parseInt(
                    body.get("reorder_level").toString()
                );

                if (price.signum() < 0 || stock < 0 || reorderLevel < 0) {
                    ctx.status(400).json(
                        Map.of("error", "Price and quantities cannot be negative")
                    );
                    return;
                }

                String sql = """
                    INSERT INTO products
                        (name, category, price, stock_quantity, reorder_level)
                    VALUES (?, ?, ?, ?, ?)
                    RETURNING id, name, category, price,
                            stock_quantity, reorder_level
                    """;

                try (Connection conn = getConnection();
                    PreparedStatement stmt = conn.prepareStatement(sql)) {

                    stmt.setString(1, name);
                    stmt.setString(2, category.isEmpty() ? null : category);
                    stmt.setBigDecimal(3, price);
                    stmt.setInt(4, stock);
                    stmt.setInt(5, reorderLevel);

                    try (ResultSet rs = stmt.executeQuery()) {
                        rs.next();

                        Map<String, Object> product = new HashMap<>();
                        product.put("id", rs.getInt("id"));
                        product.put("name", rs.getString("name"));
                        product.put("category", rs.getString("category"));
                        product.put("price", rs.getBigDecimal("price"));
                        product.put("stock_quantity", rs.getInt("stock_quantity"));
                        product.put("reorder_level", rs.getInt("reorder_level"));

                        ctx.status(201).json(product);
                    }
                }
            } catch (NumberFormatException | NullPointerException e) {
                ctx.status(400).json(
                    Map.of("error", "Enter valid price and quantity values")
                );
            } catch (java.sql.SQLException e) {
                e.printStackTrace();
                ctx.status(500).json(
                    Map.of("error", "Could not save product to database")
                );
            }
        });


        // Adjust stock by a positive or negative quantity
        app.patch("/api/products/{id}/stock", ctx -> {
            int id;

            try {
                id = Integer.parseInt(ctx.pathParam("id"));
            } catch (NumberFormatException e) {
                ctx.status(400).json(Map.of("error", "Invalid product ID"));
                return;
            }

            Map<String, Object> body = ctx.bodyAsClass(Map.class);

            try {
                int adjustment = Integer.parseInt(
                    body.get("amount").toString()
                );

                String sql = """
                    UPDATE products
                    SET stock_quantity = stock_quantity + ?
                    WHERE id = ? AND stock_quantity + ? >= 0
                    RETURNING id, name, category, price,
                              stock_quantity, reorder_level
                    """;

                try (Connection conn = getConnection();
                     PreparedStatement stmt = conn.prepareStatement(sql)) {

                    stmt.setInt(1, adjustment);
                    stmt.setInt(2, id);
                    stmt.setInt(3, adjustment);

                    try (ResultSet rs = stmt.executeQuery()) {
                        if (rs.next()) {
                            ctx.json(mapProduct(rs));
                        } else {
                            try (PreparedStatement check = conn.prepareStatement(
                                "SELECT stock_quantity FROM products WHERE id = ?"
                            )) {
                                check.setInt(1, id);

                                try (ResultSet existing = check.executeQuery()) {
                                    if (!existing.next()) {
                                        ctx.status(404).json(Map.of(
                                            "error", "Product not found"
                                        ));
                                    } else {
                                        ctx.status(400).json(Map.of(
                                            "error", "Stock cannot become negative"
                                        ));
                                    }
                                }
                            }
                        }
                    }
                }
            } catch (NumberFormatException | NullPointerException e) {
                ctx.status(400).json(Map.of(
                    "error", "Enter a valid integer adjustment amount"
                ));
            } catch (SQLException e) {
                e.printStackTrace();
                ctx.status(500).json(Map.of(
                    "error", "Could not adjust stock"
                ));
            }
        });

        
        app.post("/api/incidents", ctx -> {
            try {
                Map<String, Object> body = ctx.bodyAsClass(Map.class);

                String sql = """
                    INSERT INTO incidents
                        (incident_reference, title, category, related_reference, severity, status, notes)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    RETURNING id, incident_reference, title, category,
                            related_reference, severity, status, notes, created_at
                    """;

                try (
                    Connection conn = getConnection();
                    PreparedStatement stmt = conn.prepareStatement(sql)
                ) {
                    stmt.setString(1, (String) body.get("incident_reference"));
                    stmt.setString(2, (String) body.get("title"));
                    stmt.setString(3, (String) body.get("category"));
                    stmt.setString(4, (String) body.get("related_reference"));
                    stmt.setString(5, (String) body.get("severity"));
                    stmt.setString(6, body.get("status") == null ? "Open" : (String) body.get("status"));
                    stmt.setString(7, body.get("notes") == null ? "" : (String) body.get("notes"));

                    try (ResultSet rs = stmt.executeQuery()) {
                        rs.next();

                        Map<String, Object> incident = new LinkedHashMap<>();
                        incident.put("id", rs.getInt("id"));
                        incident.put("incident_reference", rs.getString("incident_reference"));
                        incident.put("title", rs.getString("title"));
                        incident.put("category", rs.getString("category"));
                        incident.put("related_reference", rs.getString("related_reference"));
                        incident.put("severity", rs.getString("severity"));
                        incident.put("status", rs.getString("status"));
                        incident.put("notes", rs.getString("notes"));
                        incident.put("created_at", rs.getTimestamp("created_at").toString());

                        KafkaEventProducer.publish(
                            "fraud-alerts",
                            incident.get("incident_reference").toString(),
                            """
                            {
                            "incident_reference": "%s",
                            "title": "%s",
                            "category": "%s",
                            "related_reference": "%s",
                            "severity": "%s",
                            "status": "%s"
                            }
                            """.formatted(
                                incident.get("incident_reference"),
                                incident.get("title"),
                                incident.get("category"),
                                incident.get("related_reference"),
                                incident.get("severity"),
                                incident.get("status")
                            )
                        );

                        ctx.status(201).json(incident);

                    }
                }
            } catch (Exception e) {
                e.printStackTrace();
                ctx.status(500).json(Map.of("error", "Could not save incident"));
            }
        });
        
        app.patch("/api/incidents/{reference}/status", ctx -> {
            String reference = ctx.pathParam("reference");

            Map<String, Object> body = ctx.bodyAsClass(Map.class);
            String newStatus = (String) body.get("status");

            if (!List.of("Open", "Investigating", "Resolved").contains(newStatus)) {
                ctx.status(400).json(Map.of("error", "Invalid incident status"));
                return;
            }

            String sql = """
                UPDATE incidents
                SET status = ?
                WHERE incident_reference = ?
                RETURNING id, incident_reference, status
                """;

            try (
                Connection conn = getConnection();
                PreparedStatement stmt = conn.prepareStatement(sql)
            ) {
                stmt.setString(1, newStatus);
                stmt.setString(2, reference);

                try (ResultSet rs = stmt.executeQuery()) {
                    if (rs.next()) {
                        ctx.json(Map.of(
                            "id", rs.getInt("id"),
                            "incident_reference", rs.getString("incident_reference"),
                            "status", rs.getString("status")
                        ));
                    } else {
                        ctx.status(404).json(Map.of("error", "Incident not found"));
                    }
                }
            } catch (SQLException e) {
                e.printStackTrace();
                ctx.status(500).json(Map.of("error", "Could not update incident status"));
            }
        });

        
        app.patch("/api/incidents/{reference}/notes", ctx -> {
            String reference = ctx.pathParam("reference");
            Map<String, Object> body = ctx.bodyAsClass(Map.class);
            String notes = body.get("notes") == null
                ? ""
                : body.get("notes").toString();

            String sql = """
                UPDATE incidents
                SET notes = ?
                WHERE incident_reference = ?
                RETURNING incident_reference, notes
                """;

            try (
                Connection conn = getConnection();
                PreparedStatement stmt = conn.prepareStatement(sql)
            ) {
                stmt.setString(1, notes);
                stmt.setString(2, reference);

                try (ResultSet rs = stmt.executeQuery()) {
                    if (rs.next()) {
                        ctx.json(Map.of(
                            "incident_reference", rs.getString("incident_reference"),
                            "notes", rs.getString("notes") == null ? "" : rs.getString("notes")
                        ));
                    } else {
                        ctx.status(404).json(Map.of("error", "Incident not found"));
                    }
                }
            } catch (SQLException e) {
                e.printStackTrace();
                ctx.status(500).json(Map.of("error", "Could not save incident notes"));
            }
        });


        
        app.get("/api/incidents", ctx -> {
            String sql = """
                SELECT id, incident_reference, title, category,
                    related_reference, severity, status, notes, created_at
                FROM incidents
                ORDER BY id DESC
                """;

            List<Map<String, Object>> incidents = new ArrayList<>();

            try (
                Connection conn = getConnection();
                PreparedStatement stmt = conn.prepareStatement(sql);
                ResultSet rs = stmt.executeQuery()
            ) {
                while (rs.next()) {
                    Map<String, Object> incident = new LinkedHashMap<>();
                    incident.put("id", rs.getInt("id"));
                    incident.put("incident_reference", rs.getString("incident_reference"));
                    incident.put("title", rs.getString("title"));
                    incident.put("category", rs.getString("category"));
                    incident.put("related_reference", rs.getString("related_reference"));
                    incident.put("severity", rs.getString("severity"));
                    incident.put("status", rs.getString("status"));
                    incident.put("notes", rs.getString("notes"));
                    incident.put("created_at", rs.getTimestamp("created_at").toString());

                    incidents.add(incident);
                }

                ctx.json(incidents);
            } catch (SQLException e) {
                e.printStackTrace();
                ctx.status(500).json(Map.of("error", "Could not load incidents"));
            }
        });


        // Fetch saved fraud transactions from PostgreSQL
        app.get("/api/transactions", ctx -> {
            String sql = """
                SELECT id, transaction_reference, amount,
                    risk_score, risk_level, status, created_at
                FROM fraud_transactions
                ORDER BY id DESC
                LIMIT 100
                """;

            List<Map<String, Object>> transactions = new ArrayList<>();

            try (
                Connection conn = getConnection();
                PreparedStatement stmt = conn.prepareStatement(sql);
                ResultSet rs = stmt.executeQuery()
            ) {
                while (rs.next()) {
                    Map<String, Object> transaction = new LinkedHashMap<>();

                    transaction.put("id", rs.getInt("id"));
                    transaction.put(
                        "transaction_reference",
                        rs.getString("transaction_reference")
                    );
                    transaction.put("amount", rs.getBigDecimal("amount"));
                    transaction.put("risk_score", rs.getBigDecimal("risk_score"));
                    transaction.put("risk_level", rs.getString("risk_level"));
                    transaction.put("status", rs.getString("status"));
                    transaction.put(
                        "created_at",
                        rs.getTimestamp("created_at").toString()
                    );

                    transactions.add(transaction);
                }

                ctx.json(transactions);

            } catch (SQLException e) {
                e.printStackTrace();
                ctx.status(500).json(
                    Map.of("error", "Could not load fraud transactions")
                );
            }
        });

        
        app.post("/api/transactions", ctx -> {
            Map<String, Object> body =
                ctx.bodyAsClass(Map.class);

            String reference = body.get("transaction_reference").toString();
            java.math.BigDecimal amount =
                new java.math.BigDecimal(body.get("amount").toString());
            java.math.BigDecimal riskScore =
                new java.math.BigDecimal(body.get("risk_score").toString());
            String riskLevel = body.get("risk_level").toString();
            String status = body.get("status").toString();

            String sql = """
                INSERT INTO fraud_transactions
                    (transaction_reference, amount, risk_score, risk_level, status)
                VALUES (?, ?, ?, ?, ?)
                RETURNING id, transaction_reference, amount,
                        risk_score, risk_level, status, created_at
                """;

            try (
                Connection conn = getConnection();
                PreparedStatement stmt = conn.prepareStatement(sql)
            ) {
                stmt.setString(1, reference);
                stmt.setBigDecimal(2, amount);
                stmt.setBigDecimal(3, riskScore);
                stmt.setString(4, riskLevel);
                stmt.setString(5, status);

                try (ResultSet rs = stmt.executeQuery()) {
                    if (rs.next()) {
                        Map<String, Object> transaction =
                            new LinkedHashMap<>();

                        transaction.put("id", rs.getInt("id"));
                        transaction.put(
                            "transaction_reference",
                            rs.getString("transaction_reference")
                        );
                        transaction.put("amount", rs.getBigDecimal("amount"));
                        transaction.put("risk_score", rs.getBigDecimal("risk_score"));
                        transaction.put("risk_level", rs.getString("risk_level"));
                        transaction.put("status", rs.getString("status"));
                        transaction.put(
                            "created_at",
                            rs.getTimestamp("created_at").toString()
                        );
                        
                        KafkaEventProducer.publish(
                            "transaction-events",
                            reference,
                            """
                            {
                            "transaction_reference": "%s",
                            "amount": "%s",
                            "risk_score": "%s",
                            "risk_level": "%s",
                            "status": "%s"
                            }
                            """.formatted(
                                reference,
                                amount.toPlainString(),
                                riskScore.toPlainString(),
                                riskLevel,
                                status
                            )
                        );

                        ctx.status(201).json(transaction);

                    }
                }
            } catch (SQLException e) {
                e.printStackTrace();
                ctx.status(500).json(
                    Map.of("error", "Could not save fraud transaction")
                );
            }
        });


        app.start(port);

        System.out.println(
                "NEXUS GUARD API running on http://localhost:" + port
        );
    }
}
