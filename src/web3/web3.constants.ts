export const Web3Constants = {
    abi: [
        {
            'constant': false,
            'inputs': [
                {
                    'internalType': 'string',
                    'name': 'messageUid',
                    'type': 'string'
                }
            ],
            'name': 'notify',
            'outputs': [],
            'payable': false,
            'stateMutability': 'nonpayable',
            'type': 'function',
        },
        {
            'anonymous': false,
            'inputs': [
                {
                    'indexed': false,
                    'internalType': 'string',
                    'name': 'messageUid',
                    'type': 'string',
                }
            ],
            'name': 'NotifyNewMessage',
            'type': 'event',
        },
    ],
};
