#!/bin/bash
# Decision analysis workflow using chain-of-thought reasoning

if [ $# -lt 1 ]; then
    echo "Usage: $0 <decision_question>"
    echo ""
    echo "Examples:"
    echo "  $0 'SQL vs NoSQL for fintech startup?'"
    echo "  $0 'Monolith vs microservices for MVP?'"
    echo "  $0 'GraphQL vs REST for new API?'"
    exit 1
fi

QUESTION="$1"

echo "Decision Analysis"
echo "=================="
echo "Question: $QUESTION"
echo ""
echo "Using chain-of-thought reasoning..."
echo ""

node ../../bin/perplexity/cli.js --reason "$QUESTION"
