function create_user() {
    local url="$1"
    local user_name="$2"
    local response="$WORKDIR/${TEST_UID}-01-user-${user_name}.json"
    local status=$(curl \
        -X POST "$url/users" \
        -H "accept: */*" \
        -H "Content-Type: application/json" \
        --silent \
        --write-out '%{response_code}' \
        --data "{\"name\":\"${user_name}\"}" \
        --output $response)

    case "$status" in
        201) jq . $response ;;
        *) echo "Server replied HTTP/${status}... exiting" && exit 1 ;;
    esac
}

function get_user_id() {
    local user_name="$1"
    echo "$(jq '.id' $WORKDIR/${TEST_UID}-01-user-${user_name}.json)"
}

function contact_generate_init_handshake() {
    local url="$1"
    local user_name="$2"
    local user_id="$(get_user_id $user_name)"
    local contact_name="$3"
    local response="$WORKDIR/${TEST_UID}-02-contact-init-handshake.json"
    local status=$(curl \
        -X POST "$url/contacts/generate-init-handshake/${user_id}/${contact_name}" \
        -H "accept: */*" \
        --silent \
        --write-out '%{response_code}' \
        --output $response)

    case "$status" in
        201) jq . $response ;;
        *) echo "Server replied HTTP/${status}... exiting" && exit 1 ;;
    esac
}

function contact_accept_init_handshake() {
    local url="$1"
    local user_name="$2"
    local user_id="$(get_user_id $user_name)"
    local contact_name="$3"
    local init_handshake="$WORKDIR/${TEST_UID}-02-contact-init-handshake.json"
    local status=$(curl \
        -X POST "$url/contacts/accept-init-handshake/${user_id}/${contact_name}" \
        -H "accept: */*" \
        -H "Content-Type: application/json" \
        --silent \
        --write-out '%{response_code}' \
        --data "@${init_handshake}")

    case "$status" in
        201) echo "OK" ;;
        *) echo "Server replied HTTP/${status}... exiting" && exit 1 ;;
    esac
}

function contact_generate_reply_handshake() {
    local url="$1"
    local user_name="$2"
    local user_id="$(get_user_id $user_name)"
    local contact_name="$3"
    local response="$WORKDIR/${TEST_UID}-03-contact-reply-handshake.json"
    local status=$(curl \
        -X POST "$url/contacts/generate-reply-handshake/${user_id}/${contact_name}" \
        -H "accept: */*" \
        --silent \
        --write-out '%{response_code}' \
        --output $response)

    case "$status" in
        201) jq . $response ;;
        *) echo "Server replied HTTP/${status}... exiting" && exit 1 ;;
    esac
}

function contact_accept_reply_handshake() {
    local url="$1"
    local user_name="$2"
    local user_id="$(get_user_id $user_name)"
    local contact_name="$3"
    local response="$WORKDIR/${TEST_UID}-03-contact-reply-handshake.json"
    local status=$(curl \
        -X POST "$url/contacts/accept-reply-handshake/${user_id}/${contact_name}" \
        -H "accept: */*" \
        -H "Content-Type: application/json" \
        --silent \
        --write-out '%{response_code}' \
        --data "@${response}")

    case "$status" in
        201) jq . $response ;;
        *) echo "Server replied HTTP/${status}... exiting" && exit 1 ;;
    esac
}

## WARN using development module for now to get contact id needed to create channels
##      we should be able to retrieve this id when creating the contact like users
function get_contact_id() {
    local url="$1"
    local user_name="$2"
    local user_id="$(get_user_id $user_name)"
    local contact_name="$3"
    local response="$WORKDIR/${TEST_UID}-04-${user_name}-contact-${contact_name}.json"
    curl \
        -X GET "$url/development/contact/${user_id}/${contact_name}" \
        -H "accept: */*" \
        --silent \
        --output $response
    echo "$(jq .id $response)"
}

function create_channel() {
    local url="$1"
    local user_name="$2"
    local user_id="$(get_user_id $user_name)"
    local contact_name="$3"
    local contact_id=$(get_contact_id $url $user_name $contact_name)
    local response="$WORKDIR/${TEST_UID}-05-${user_name}-channel-${contact_name}.json"
    local status=$(curl \
        -X POST "$url/channels" \
        -H "accept: */*" \
        -H "Content-Type: application/json" \
        --silent \
        --write-out '%{response_code}' \
        --data "{\"name\":\"${user_name}--${contact_name}\",\"userId\":${user_id},\"contactId\":${contact_id} }" \
        --output $response)

    case "$status" in
        201) jq . $response ;;
        *) echo "Server replied HTTP/${status}... exiting" && exit 1 ;;
    esac
}

function send_message() {
    local url="$1"
    local user_name="$2"
    local contact_name="$3"
    local message_contents="$4"
    local user_id="$(get_user_id $user_name)"
    local channel_id=$(jq '.id' "$WORKDIR/${TEST_UID}-05-${user_name}-channel-${contact_name}.json")
    local response="$WORKDIR/${TEST_UID}-06-${user_name}-message-${contact_name}.json"
    local status=$(curl \
        -X POST "$url/channels/message" \
        -H "accept: */*" \
        -H "Content-Type: application/json" \
        --silent \
        --write-out '%{response_code}' \
        --data "{\"messageContents\":\"${message_contents}\",\"userId\":${user_id},\"channelId\":${channel_id} }" \
        --output $response)

    case "$status" in
        201) jq . $response ;;
        *) echo "Server replied HTTP/${status}... exiting" && exit 1 ;;
    esac
}

function process_messages() {
    local url="$1"
    curl \
        -X GET "$url/channels/refresh" \
        -H "accept: */*" \
        --silent
}

function receive_message() {
    local url="$1"
    local user_name="$2"
    local contact_name="$3"
    local contact_id=$(get_contact_id $url $user_name $contact_name)
    local response="$WORKDIR/${TEST_UID}-07-${user_name}-message-${contact_name}.json"
    local status=$(curl \
                       "$url/channels/message?contactId=${contact_id}" \
                       -H "accept: */*" \
                       --silent \
                       --write-out '%{response_code}' \
                       --output $response)

    case "$status" in
        200) jq '.' $response ;;
        *) echo "Server replied HTTP/${status}... exiting" && exit 1 ;;
    esac
}
