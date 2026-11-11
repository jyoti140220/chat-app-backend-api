CREATE DATABASE IF NOT EXISTS chatdb;
USE chatdb;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_a_id INT NOT NULL,
  user_b_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_a_id) REFERENCES users(id),
  FOREIGN KEY (user_b_id) REFERENCES users(id),
  CONSTRAINT chk_order CHECK (user_a_id < user_b_id),
  UNIQUE KEY uniq_pair (user_a_id, user_b_id)
);

INSERT INTO users (name) VALUES ('Alice'), ('Bob'), ('Charlie');
