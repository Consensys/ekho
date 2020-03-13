export const Web3Constants = {
  abi: [
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: 'bytes',
          name: 'message',
          type: 'bytes',
        },
      ],
      name: 'ekho',
      type: 'event',
    },
    {
      constant: false,
      inputs: [
        {
          internalType: 'bytes',
          name: 'message',
          type: 'bytes',
        },
      ],
      name: 'broadcast',
      outputs: [],
      payable: false,
      stateMutability: 'nonpayable',
      type: 'function',
    },
  ],
};
