export const Web3Constants = {
  abi: [
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: 'string',
          name: 'channelId',
          type: 'string',
        },
        {
          indexed: false,
          internalType: 'string',
          name: 'content',
          type: 'string',
        },
        {
          indexed: false,
          internalType: 'string',
          name: 'signature',
          type: 'string',
        },
      ],
      name: 'NotifyNewMessage',
      type: 'event',
    },
    {
      constant: false,
      inputs: [
        {
          internalType: 'string',
          name: 'channelId',
          type: 'string',
        },
        {
          internalType: 'string',
          name: 'content',
          type: 'string',
        },
        {
          internalType: 'string',
          name: 'signature',
          type: 'string',
        },
      ],
      name: 'notify',
      outputs: [],
      payable: false,
      stateMutability: 'nonpayable',
      type: 'function',
    },
  ],
};
