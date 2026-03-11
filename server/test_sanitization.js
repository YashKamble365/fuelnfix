const sanitize = (val) => val.trim().replace(/[^a-zA-Z0-9\s-_]/g, '').replace(/[\s-]+/g, '_');

const testInputs = [
    { name: 'ownerName with spaces', input: ' vkizl4CAIQSZk37trHQbCVgNj9w2 ', expected: 'vkizl4CAIQSZk37trHQbCVgNj9w2' },
    { name: 'publicId with spaces and extension', input: '1773162939945_IMG _5701.jpg', expected: '1773162939945_IMG_5701' },
    { name: 'special characters', input: 'my@shop#name! 123', expected: 'myshopname_123' },
    { name: 'multiple dashes and spaces', input: 'fuel-delivery - service', expected: 'fuel_delivery_service' }
];

console.log('--- Testing Sanitization Logic ---');
testInputs.forEach(test => {
    let input = test.input;
    if (test.name === 'publicId with spaces and extension') {
        input = input.replace(/\.[^/.]+$/, ''); // Remove extension first as per code
    }
    const result = sanitize(input);
    const passed = result === test.expected;
    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${test.name}`);
    console.log(`  Input:    "${test.input}"`);
    console.log(`  Result:   "${result}"`);
    console.log(`  Expected: "${test.expected}"`);
});
