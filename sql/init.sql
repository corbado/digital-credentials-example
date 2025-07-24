-- Create database if not exists
CREATE DATABASE IF NOT EXISTS digital_credentials;
USE digital_credentials;

-- Table for storing challenges
CREATE TABLE IF NOT EXISTS challenges (
    id VARCHAR(36) PRIMARY KEY,
    challenge VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used BOOLEAN DEFAULT FALSE,
    INDEX idx_challenge (challenge),
    INDEX idx_expires_at (expires_at)
);

-- Table for storing verification sessions
CREATE TABLE IF NOT EXISTS verification_sessions (
    id VARCHAR(36) PRIMARY KEY,
    challenge_id VARCHAR(36),
    status ENUM('pending', 'verified', 'failed', 'expired') DEFAULT 'pending',
    presentation_data JSON,
    verified_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE,
    INDEX idx_challenge_id (challenge_id),
    INDEX idx_status (status)
);

-- Table for storing verified credentials data (optional)
CREATE TABLE IF NOT EXISTS verified_credentials (
    id VARCHAR(36) PRIMARY KEY,
    session_id VARCHAR(36),
    credential_type VARCHAR(255),
    issuer VARCHAR(255),
    subject VARCHAR(255),
    claims JSON,
    verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES verification_sessions(id) ON DELETE CASCADE,
    INDEX idx_session_id (session_id),
    INDEX idx_credential_type (credential_type)
); 