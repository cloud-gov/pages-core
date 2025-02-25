#!/bin/sh

# Wait for MinIO to start
sleep 10

# Set up MinIO Client
mc alias set localminio $MINIO_ENDPOINT_URL $MINIO_ROOT_USER $MINIO_ROOT_PASSWORD

# Create multiple buckets

build_buckets() {
  local error_output
  local bucket_exists="Your previous request to create the named bucket succeeded and you already own it"

  # Load the .env file
  local env_file="/app/services/local/local-docker.env"

  if [ -f "$env_file" ]; then
    while IFS='=' read -r key value; do
        # Ignore comments and empty lines
        if [[ ! $key =~ ^# && -n $key ]]; then
            # Remove surrounding quotes from the value using parameter expansion
            value="${value#\"}"  # Remove leading double quote
            value="${value%\"}"   # Remove trailing double quote
            value="${value#\'}"   # Remove leading single quote
            value="${value%\'}"    # Remove trailing single quote

            # Set local variable
            declare "$key=$value"
        fi

    done < "$env_file"
  else
      echo ".env file not found!"
      exit 1
  fi

  # Turn inot list of service names (buckets)
  IFS=',' read -r -a array <<< "$SITES_SERVICE_NAMES"

  for bucket in "${array[@]}"; do

    # Attempt to create the bucket and capture any error output
    error_output=$(mc mb localminio/$bucket 2>&1)

    # mc mb localminio/ $bucket

    # Check if there was an error
    if [ $? -ne 0 ]; then
      # Check the error was not an existing bucket
      if [[ $error_output != *"$bucket_exists"* ]]; then
        echo "Error creating $bucket: $error_output"
      fi

      echo "Bucket exists $bucket"
    else
      echo "Successfully created $bucket"
    fi
  done
}

# Run
build_buckets
