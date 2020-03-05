#!/bin/bash -xe
BASE_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." >/dev/null 2>&1 && pwd )"
source $BASE_DIR/bin/api-functions.sh

WORKDIR="$BASE_DIR/tmp/smoke-test-dual-node"
mkdir -p $WORKDIR

TEST_UID="$(date '+%Y%m%d-%H%M%S')"
EKHO_1="http://localhost:3100"
EKHO_2="http://localhost:3200"

bob="$TEST_UID-bob"
alice="$TEST_UID-alice"

# create users
create_user "$EKHO_1" "$bob"
create_user "$EKHO_2" "$alice"

# create contacts
contact_generate_init_handshake  "$EKHO_1" "$bob" "$alice"
contact_accept_init_handshake    "$EKHO_2" "$alice" "$bob"
contact_generate_reply_handshake "$EKHO_2" "$alice" "$bob"
contact_accept_reply_handshake   "$EKHO_1" "$bob" "$alice"

# create channels
create_channel $EKHO_1 $bob $alice
create_channel $EKHO_2 $alice $bob

# send messages
send_message $EKHO_1 $bob $alice "hey $alice, wasup?"
send_message $EKHO_2 $alice $bob "hi $bob, all good, what about you?"

# process messages
process_messages $EKHO_1
process_messages $EKHO_2

# receive messages
receive_message $EKHO_2 $alice $bob
receive_message $EKHO_1 $bob $alice
