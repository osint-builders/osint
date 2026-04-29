#!/bin/bash
# Form filling workflow: navigate, fill form, submit, verify

# Configuration
URL="https://example.com/contact-form"

echo "1. Navigate to form..."
agent-browser open "$URL"

echo "2. Get form elements..."
agent-browser snapshot -i

# Assuming refs from snapshot: @e1=Name, @e2=Email, @e3=Message, @e4=Submit
echo "3. Fill form fields..."
agent-browser fill @e1 "John Doe"
agent-browser fill @e2 "john@example.com"
agent-browser fill @e3 "This is a test message"

echo "4. Submit form..."
agent-browser click @e4

echo "5. Wait for confirmation..."
agent-browser wait --text "Thank you"

echo "6. Take screenshot of confirmation..."
agent-browser screenshot confirmation.png

echo "7. Close browser..."
agent-browser close

echo "Form submission complete!"
