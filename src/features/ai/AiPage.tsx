'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, Typography } from '@mui/material';
import { apiClient } from '@/lib/apiClient';
import ChatWindow from '@/components/chat/ChatWindow';

export default function AiPage() {
  const { data: messages = [] } = useQuery({
    queryKey: ['ai-messages'],
    queryFn: apiClient.getAiMessages,
  });
  const [attachContext, setAttachContext] = useState(true);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
        AI Analysis
      </Typography>
      <ChatWindow
        messages={messages}
        attachContext={attachContext}
        onToggleAttachContext={setAttachContext}
      />
    </Box>
  );
}
