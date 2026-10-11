
package com.nexusguard;

import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.clients.consumer.ConsumerRecords;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.common.serialization.StringDeserializer;

import java.time.Duration;
import java.util.List;
import java.util.Properties;

public class KafkaEventConsumer implements Runnable {

    private final String topic;
    private final String groupId;
    private volatile boolean running = true;
    private KafkaConsumer<String, String> consumer;

    public KafkaEventConsumer(String topic, String groupId) {
        this.topic = topic;
        this.groupId = groupId;
    }

    @Override
    public void run() {
        Properties props = new Properties();

        props.put(
            ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG,
            System.getenv().getOrDefault(
                "KAFKA_BOOTSTRAP_SERVERS", "localhost:9092"
            )
        );
        props.put(ConsumerConfig.GROUP_ID_CONFIG, groupId);
        props.put(
            ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG,
            StringDeserializer.class.getName()
        );
        props.put(
            ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG,
            StringDeserializer.class.getName()
        );
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, "true");

        try (KafkaConsumer<String, String> kafkaConsumer =
                 new KafkaConsumer<>(props)) {

            consumer = kafkaConsumer;
            kafkaConsumer.subscribe(List.of(topic));

            System.out.println(
                "Kafka consumer listening to topic: " + topic
            );

            while (running) {
                ConsumerRecords<String, String> records =
                    kafkaConsumer.poll(Duration.ofMillis(500));

                for (ConsumerRecord<String, String> record : records) {
                    System.out.println(
                        "Kafka event received | topic=" + record.topic()
                        + " | key=" + record.key()
                        + " | value=" + record.value()
                    );
                }
            }

        } catch (Exception e) {
            if (running) {
                System.err.println(
                    "Kafka consumer error for " + topic + ": "
                    + e.getMessage()
                );
            }
        } finally {
            consumer = null;
        }
    }

    public void stop() {
        running = false;

        KafkaConsumer<String, String> current = consumer;
        if (current != null) {
            current.wakeup();
        }
    }
}
