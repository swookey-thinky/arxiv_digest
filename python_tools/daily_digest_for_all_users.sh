#!/bin/bash

# Loop through the arguments
while [[ $# -gt 0 ]]; do
  key="$1"

  case $key in
    --python_script)
      python_script="$2"
      shift # past argument
      shift # past value
      ;;
    --python_script_path)
      python_script_path="$2"
      shift # past argument
      shift # past value
      ;;
    --openai_key)
      openai_key="$2"
      shift # past argument
      shift # past value
      ;;
    --firebase_service_account)
      firebase_service_account="$2"
      shift
      shift
      ;;
    *)
      echo "Unknown option $1"
      exit 1
      ;;
  esac
done

# Check to make sure the arguments are not empty
check_empty() {
  local var_name="$1"
  local var_value="$2"

  if [ -z "$var_value" ]; then
    echo "Error: '$var_name' variable is empty or not set."
    exit 1
  fi
}

check_empty "openai_key" "$openai_key"
check_empty "firebase_service_account" "$firebase_service_account"
check_empty "python_script" "$python_script"
check_empty "python_script_path" "$python_script_path"

export OPENAI_API_KEY="$openai_key"
export GOOGLE_APPLICATION_CREDENTIALS="$firebase_service_account"

temp_dir=$(mktemp -d)
echo "Installing in '$temp_dir'"
python3 -m venv $temp_dir
source $temp_dir/bin/activate
python3 -m pip install --upgrade pip
python3 -m pip install requests lxml openai beautifulsoup4 google-cloud-firestore pytz
pushd $python_script_path
python3 $python_script
popd
deactivate
rm -rf $temp_dir