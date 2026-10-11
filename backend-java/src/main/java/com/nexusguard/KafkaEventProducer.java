
package com.nexusguard;

import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.ProducerRecord;

import java.util.Properties;

public class KafkaEventProducer {

    private static final KafkaProducer<String, String> producer =
            createProducer();

    private static KafkaProducer<String, String> createProducer() {
        Properties props = new Properties();

        props.put("bootstrap.servers",
                System.getenv().getOrDefault(
                        "KAFKA_BOOTSTRAP_SERVERS", "localhost:9092"));

        props.put("key.serializer",
                "org.apache.kafka.common.serialization.StringSerializer");
        props.put("value.serializer",
                "org.apache.kafka.common.serialization.StringSerializer");
        props.put("acks", "all");

        return new KafkaProducer<>(props);
    }

    public static void publish(
            String topic, String key, String message) {

        producer.send(
                new ProducerRecord<>(topic, key, message),
                (metadata, exception) -> {
                    if (exception != null) {
                        System.err.println(
                                "Kafka publish failed: "
                                        + exception.getMessage());
                    } else {
                        System.out.println(
                                "Kafka event published: topic="
                                        + metadata.topic()
                                        + ", partition="
                                        + metadata.partition()
                                        + ", offset="
                                        + metadata.offset());
                    }
                });
    }

    public static void close() {
        producer.close();
    }
}
