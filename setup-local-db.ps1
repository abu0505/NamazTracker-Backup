# PowerShell script to set up local PostgreSQL database for Namaz Tracker
# This script requires administrator privileges for some operations

# Database configuration
$dbName = "namaz_tracker"
$dbUser = "namaz_user"
$dbPassword = "namaz_password"

Write-Host "Setting up PostgreSQL database for Namaz Tracker..." -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Yellow

# Check if running as administrator
$currentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object System.Security.Principal.WindowsPrincipal($currentUser)
$isAdmin = $principal.IsInRole([System.Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "Warning: Not running as administrator. Some operations may fail." -ForegroundColor Red
    Write-Host "Please run this script as administrator or manually start PostgreSQL service." -ForegroundColor Yellow
}

# Try to start PostgreSQL if not running
Write-Host "Attempting to start PostgreSQL service..." -ForegroundColor Cyan
try {
    if ($isAdmin) {
        $startResult = net start postgresql-x64-17 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "PostgreSQL service started successfully." -ForegroundColor Green
        } else {
            Write-Host "Failed to start PostgreSQL service automatically." -ForegroundColor Red
            Write-Host "Please start PostgreSQL manually through Services.msc or pgAdmin." -ForegroundColor Yellow
        }
    } else {
        Write-Host "Cannot start PostgreSQL service without administrator privileges." -ForegroundColor Red
    }
} catch {
    Write-Host "Could not start PostgreSQL service. Error: $_" -ForegroundColor Red
}

# Wait a moment for service to start
Start-Sleep -Seconds 3

# Create database and user using psql
Write-Host "Creating database '$dbName' and user '$dbUser'..." -ForegroundColor Cyan

$createScript = @"
-- Create database user
CREATE USER $dbUser WITH PASSWORD '$dbPassword';

-- Create database owned by the user
CREATE DATABASE $dbName OWNER $dbUser;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE $dbName TO $dbUser;

-- Connect to the database and create extensions
\c $dbName
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
"@

# Save the script to a temporary SQL file
$sqlFile = "temp_setup.sql"
$createScript | Out-File -FilePath $sqlFile -Encoding utf8

try {
    # Run the SQL script as postgres superuser
    Write-Host "Running database setup with psql..." -ForegroundColor Cyan
    $psqlResult = psql -U postgres -f $sqlFile 2>&1

    if ($LASTEXITCODE -eq 0) {
        Write-Host "Database setup completed successfully!" -ForegroundColor Green
        Write-Host "Database: $dbName" -ForegroundColor Green
        Write-Host "User: $dbUser" -ForegroundColor Green
    } else {
        Write-Host "Database setup may have failed or requires manual intervention." -ForegroundColor Red
        Write-Host "psql output: $psqlResult" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Failed to run database setup automatically. Error: $_" -ForegroundColor Red
    Write-Host "You may need to run the SQL commands manually in pgAdmin or psql." -ForegroundColor Yellow
} finally {
    # Clean up temporary file
    if (Test-Path $sqlFile) {
        Remove-Item $sqlFile
    }
}

Write-Host "`nDatabase setup script completed." -ForegroundColor Green
Write-Host "If setup was not successful, please ensure:" -ForegroundColor Cyan
Write-Host "1. PostgreSQL service is running" -ForegroundColor White
Write-Host "2. You can connect with: psql -U postgres" -ForegroundColor White
Write-Host "3. Run the SQL commands manually if needed" -ForegroundColor White
Write-Host "`nSQL to run manually:" -ForegroundColor Yellow
Write-Host "CREATE USER $dbUser WITH PASSWORD '$dbPassword';" -ForegroundColor White
Write-Host "CREATE DATABASE $dbName OWNER $dbUser;" -ForegroundColor White
Write-Host "Run 'npm run db:push' to create tables after database is ready." -ForegroundColor Green
