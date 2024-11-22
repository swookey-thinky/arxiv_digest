#!/bin/bash

# Loop through the arguments
while [[ $# -gt 0 ]]; do
  key="$1"

  case $key in
    --python_script_path)
      python_script_path="$2"
      shift # past argument
      shift # past value
      ;;
    --recipient_email)
      recipient_email="$2"
      shift # past argument
      shift # past value
      ;;
    --subject_title)
      subject_title="$2"
      shift
      shift
      ;;
    --header_title)
      header_title="$2"
      shift
      shift
      ;;
    --sender_email)
      sender_email="$2"
      shift # past argument
      shift # past value
      ;;
    --sender_password)
      sender_password="$2"
      shift # past argument
      shift # past value
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

check_empty "recipient_email" "$recipient_email"
check_empty "subject_title" "$subject_title"
check_empty "header_title" "$header_title"
check_empty "python_script_path" "$python_script_path"
check_empty "sender_email" "$sender_email"
check_empty "sender_password" "$sender_password"

export SENDER_EMAIL="$sender_email"
export SENDER_PASSWORD="$sender_password"

temp_dir=$(mktemp -d)
echo "Installing in '$temp_dir'"
python3 -m venv $temp_dir
source $temp_dir/bin/activate
python3 -m pip install --upgrade pip
python3 -m pip install requests beautifulsoup4
python3 $python_script_path --recipient_email "$recipient_email" --subject_title "$subject_title" --header_title "$header_title"
deactivate
rm -rf $temp_dir