cd server
npm run start -- update_prompt --id test_chain --name "Test Chain" --category "test" --description "A test chain" --isChain true --userMessageTemplate "Process: {{content}}" --arguments "[{\"name\":\"content\",\"required\":true}]" --chainSteps "[{\"promptId\":\"step1\",\"stepName\":\"First\",\"inputMapping\":{\"content\":\"content\"},\"outputMapping\":{\"result\":\"result\"}}]" 