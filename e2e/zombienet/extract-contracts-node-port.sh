#!/bin/bash

# Path to the log file
LOG_FILE="./zombienet-logs.txt"

# Output file for the extracted port
OUTPUT_FILE="./contracts-node-port.txt"

# Path to the wait-for-port script
WAIT_FOR_PORT_SCRIPT="./wait-for-port.sh"

# Function to extract the third port, save it, and call wait-for-port
extract_and_check_port() {
  echo "Checking log file for the third --rpc-port > 10000..."

  # Use grep to find lines containing "--rpc-port", then extract ports > 10000
  ports=$(grep -- "--rpc-port" "$LOG_FILE" | awk '{
    for (i = 1; i <= NF; i++) {
      if ($i == "--rpc-port") {
        port = $(i+1);
        if (port > 10000) {
          print port;
        }
      }
    }
  }')

  # Convert ports to an array and get the third port
  ports_array=($ports)
  if [[ ${#ports_array[@]} -ge 7 ]]; then
    port=${ports_array[2]} # Index 2 for the third port (zero-based indexing)
    echo "Found third rpc-port > 10000: $port"
    echo "$port" > "$OUTPUT_FILE"
    echo "Port saved to $OUTPUT_FILE"

    # Run the wait-for-port script
    if [[ -x "$WAIT_FOR_PORT_SCRIPT" ]]; then
      echo "Running wait-for-port.sh for port $port..."
      bash "$WAIT_FOR_PORT_SCRIPT" "$port"
      echo "wait-for-port.sh completed. Exiting."
      exit 0 # Exit the script after running wait-for-port.sh
    else
      echo "Error: wait-for-port.sh not found or not executable."
      exit 1
    fi
  else
    echo "Third --rpc-port > 10000 not found in the log file. Checking again..."
  fi
}

# Loop until the third port is found
while true; do
  extract_and_check_port
  sleep 5
done