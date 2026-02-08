import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const COUNTRY_CODES = [
    { code: '+91', country: 'IN', flag: '🇮🇳' },
    { code: '+1', country: 'US', flag: '🇺🇸' },
    { code: '+44', country: 'UK', flag: '🇬🇧' },
    { code: '+971', country: 'UAE', flag: '🇦🇪' },
    { code: '+61', country: 'AU', flag: '🇦🇺' },
];

const PhoneInput = ({ value, onChange, placeholder = "Phone Number", className = "" }) => {
    const [selectedCode, setSelectedCode] = useState('+91');
    const [phoneNumber, setPhoneNumber] = useState('');

    useEffect(() => {
        if (value) {
            // Attempt to split value into code and number
            const matchingCode = COUNTRY_CODES.find(c => value.startsWith(c.code));
            if (matchingCode) {
                setSelectedCode(matchingCode.code);
                setPhoneNumber(value.replace(matchingCode.code, ''));
            } else {
                // If no matching code found, keep default code and put entire value in number (or handle as needed)
                // For now, assuming if no code match, it might be raw number
                setPhoneNumber(value);
            }
        } else {
            setPhoneNumber('');
        }
    }, [value]);

    const handleCodeChange = (e) => {
        const newCode = e.target.value;
        setSelectedCode(newCode);
        onChange(`${newCode}${phoneNumber}`);
    };

    const handleNumberChange = (e) => {
        const newNumber = e.target.value.replace(/\D/g, ''); // Only allow digits
        setPhoneNumber(newNumber);
        onChange(`${selectedCode}${newNumber}`);
    };

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <div className="relative">
                <select
                    value={selectedCode}
                    onChange={handleCodeChange}
                    className="h-full min-h-[inherit] appearance-none bg-background/50 border border-border rounded-xl pl-3 pr-8 py-2 text-sm font-bold focus:outline-none focus:border-primary cursor-pointer outline-none"
                    style={{ minHeight: 'inherit' }}
                >
                    {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>
                            {c.flag} {c.code}
                        </option>
                    ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
            <input
                type="tel"
                value={phoneNumber}
                onChange={handleNumberChange}
                placeholder={placeholder}
                className="flex-1 w-full bg-background/50 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
                style={{ minHeight: 'inherit' }} // inherit height from parent container if needed
            />
        </div>
    );
};

export default PhoneInput;
