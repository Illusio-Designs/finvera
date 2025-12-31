#!/bin/bash
# =================================
# Reset RDS Password Script
# Prompts for new password, tests it, saves it, and updates .env
# =================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# AWS Configuration
AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-AKIA47CRV3N4HMMSJYF3}"
AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-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}"
AWS_REGION="${AWS_REGION:-us-east-1}"
RDS_INSTANCE_ID="${RDS_INSTANCE_ID:-finvera-mysql-db}"

# Export AWS credentials
export AWS_ACCESS_KEY_ID
export AWS_SECRET_ACCESS_KEY
export AWS_DEFAULT_REGION=$AWS_REGION

PASSWORD_FILE=".rds-password"
ENV_FILE=".env"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  RDS Password Reset & Update Script                       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Get RDS instance details
echo -e "${YELLOW}Fetching RDS instance details...${NC}"
RDS_ENDPOINT=$(aws rds describe-db-instances \
    --region $AWS_REGION \
    --db-instance-identifier $RDS_INSTANCE_ID \
    --query 'DBInstances[0].Endpoint.Address' \
    --output text 2>/dev/null)

RDS_USER=$(aws rds describe-db-instances \
    --region $AWS_REGION \
    --db-instance-identifier $RDS_INSTANCE_ID \
    --query 'DBInstances[0].MasterUsername' \
    --output text 2>/dev/null)

if [ -z "$RDS_ENDPOINT" ] || [ "$RDS_ENDPOINT" == "None" ]; then
    echo -e "${RED}Error: Could not find RDS instance: $RDS_INSTANCE_ID${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} RDS Endpoint: $RDS_ENDPOINT"
echo -e "${GREEN}✓${NC} RDS Username: $RDS_USER"
echo ""

# Check if MySQL client is installed
if ! command -v mysql &> /dev/null; then
    echo -e "${YELLOW}Warning: MySQL client not found. Connection test will be skipped.${NC}"
    echo -e "${YELLOW}Install with: brew install mysql-client (macOS) or apt-get install mysql-client (Linux)${NC}"
    SKIP_TEST=true
else
    SKIP_TEST=false
fi

# Prompt for password
echo -e "${BLUE}Enter RDS database password:${NC}"
read -s RDS_PASSWORD
echo ""

if [ -z "$RDS_PASSWORD" ]; then
    echo -e "${RED}Error: Password cannot be empty${NC}"
    exit 1
fi

# Test connection if MySQL client is available
if [ "$SKIP_TEST" = false ]; then
    echo -e "${YELLOW}Testing database connection...${NC}"
    export MYSQL_PWD="$RDS_PASSWORD"
    if mysql -h "$RDS_ENDPOINT" -u "$RDS_USER" -e "SELECT 1" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} Database connection successful!"
    else
        echo -e "${RED}✗${NC} Database connection failed!"
        echo -e "${YELLOW}Please verify the password is correct.${NC}"
        echo -e "${YELLOW}Continuing anyway... (you can test manually later)${NC}"
    fi
    unset MYSQL_PWD
else
    echo -e "${YELLOW}⚠${NC} Skipping connection test (MySQL client not available)"
fi

echo ""

# Save password to file
echo "$RDS_PASSWORD" > "$PASSWORD_FILE"
chmod 600 "$PASSWORD_FILE"
echo -e "${GREEN}✓${NC} Password saved to $PASSWORD_FILE"

# Update .env file
if [ -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}Updating .env file...${NC}"
    
    # Backup .env file
    cp "$ENV_FILE" "${ENV_FILE}.backup"
    echo -e "${GREEN}✓${NC} Created backup: ${ENV_FILE}.backup"
    
    # Update DB_PASSWORD
    if grep -q "^DB_PASSWORD=" "$ENV_FILE"; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|^DB_PASSWORD=.*|DB_PASSWORD=$RDS_PASSWORD|" "$ENV_FILE"
        else
            sed -i "s|^DB_PASSWORD=.*|DB_PASSWORD=$RDS_PASSWORD|" "$ENV_FILE"
        fi
        echo -e "${GREEN}✓${NC} Updated DB_PASSWORD in .env"
    else
        # Add DB_PASSWORD if not found
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "/^DB_NAME=/a\\
DB_PASSWORD=$RDS_PASSWORD
" "$ENV_FILE"
        else
            sed -i "/^DB_NAME=/a DB_PASSWORD=$RDS_PASSWORD" "$ENV_FILE"
        fi
        echo -e "${GREEN}✓${NC} Added DB_PASSWORD to .env"
    fi
    
    # Update DB_ROOT_PASSWORD
    if grep -q "^DB_ROOT_PASSWORD=" "$ENV_FILE"; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|^DB_ROOT_PASSWORD=.*|DB_ROOT_PASSWORD=$RDS_PASSWORD|" "$ENV_FILE"
        else
            sed -i "s|^DB_ROOT_PASSWORD=.*|DB_ROOT_PASSWORD=$RDS_PASSWORD|" "$ENV_FILE"
        fi
        echo -e "${GREEN}✓${NC} Updated DB_ROOT_PASSWORD in .env"
    else
        # Add DB_ROOT_PASSWORD if not found
        if grep -q "^DB_ROOT_USER=" "$ENV_FILE"; then
            if [[ "$OSTYPE" == "darwin"* ]]; then
                sed -i '' "/^DB_ROOT_USER=/a\\
DB_ROOT_PASSWORD=$RDS_PASSWORD
" "$ENV_FILE"
            else
                sed -i "/^DB_ROOT_USER=/a DB_ROOT_PASSWORD=$RDS_PASSWORD" "$ENV_FILE"
            fi
        else
            # Add after DB_ROOT_USER or at end of database section
            if [[ "$OSTYPE" == "darwin"* ]]; then
                sed -i '' "/^MASTER_DB_NAME=/a\\
DB_ROOT_USER=$RDS_USER\\
DB_ROOT_PASSWORD=$RDS_PASSWORD
" "$ENV_FILE"
            else
                sed -i "/^MASTER_DB_NAME=/a DB_ROOT_USER=$RDS_USER\nDB_ROOT_PASSWORD=$RDS_PASSWORD" "$ENV_FILE"
            fi
        fi
        echo -e "${GREEN}✓${NC} Added DB_ROOT_PASSWORD to .env"
    fi
else
    echo -e "${YELLOW}⚠${NC} .env file not found, skipping update"
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Password Reset Complete!                                    ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Summary:${NC}"
echo -e "  ${GREEN}✓${NC} Password saved to: $PASSWORD_FILE"
echo -e "  ${GREEN}✓${NC} .env file updated"
echo -e "  ${GREEN}✓${NC} Backup created: ${ENV_FILE}.backup"
echo ""
echo -e "${YELLOW}Note: The password file ($PASSWORD_FILE) is secured with chmod 600${NC}"

