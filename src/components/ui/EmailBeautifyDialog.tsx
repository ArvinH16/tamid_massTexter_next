import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog';
import { Button } from './button';
import { Input } from './input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Alert, AlertDescription } from './alert';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Eye,
  Monitor,
  Smartphone,
  Loader2,
  AlertCircle,
  Palette,
  RefreshCw,
  Mail,
  CheckCircle2,
  Code,
  MessageSquare,
  Send,
  Bot,
  User
} from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    border: string;
  };
}

interface AIEnhancements {
  enhancedSubject: string;
  subtitle: string;
  formattedContent: string;
  signature: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface EmailBeautifyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  subject: string;
  onConfirm: (htmlContent: string, plainTextFallback: string, enhancedSubject: string) => void;
  orgName?: string;
}

interface AIChatInterfaceProps {
  showAIChat: boolean;
  setShowAIChat: (show: boolean) => void;
  chatMessages: ChatMessage[];
  currentMessage: string;
  setCurrentMessage: (message: string) => void;
  isChatLoading: boolean;
  handleSendChatMessage: () => void;
  chatInputRef: React.RefObject<HTMLInputElement | null>;
}

const AIChatInterface = React.memo(({ 
  showAIChat, 
  setShowAIChat, 
  chatMessages, 
  currentMessage, 
  setCurrentMessage, 
  isChatLoading, 
  handleSendChatMessage,
  chatInputRef 
}: AIChatInterfaceProps) => {
  if (!showAIChat) return null;

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <div className="flex items-center">
            <MessageSquare className="h-4 w-4 mr-2 text-blue-500" />
            AI Assistant
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowAIChat(false)}
            className="h-6 w-6 p-0"
          >
            ×
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Chat Messages */}
        <div className="max-h-60 overflow-y-auto space-y-2 border rounded p-2 bg-gray-50">
          {chatMessages.length === 0 ? (
            <div className="text-center text-gray-500 text-sm py-4">
              <Bot className="h-6 w-6 mx-auto mb-2 opacity-50" />
              Ask me to customize your email!<br />
              <div className="text-xs mt-2 space-y-1">
                <div>💡 Try: &quot;Make the header more colorful&quot;</div>
                <div>💡 Try: &quot;Add a call-to-action button&quot;</div>
                <div>💡 Try: &quot;Change to a darker theme&quot;</div>
                <div>💡 Try: &quot;Make it more modern&quot;</div>
              </div>
            </div>
          ) : (
            chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-2 rounded-lg text-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {msg.role === 'assistant' && <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                    {msg.role === 'user' && <User className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                    <div className="flex-1">{msg.content}</div>
                  </div>
                </div>
              </div>
            ))
          )}
          {isChatLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 p-2 rounded-lg text-sm">
                <div className="flex items-center space-x-2">
                  <Bot className="h-4 w-4" />
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <div className="flex space-x-2">
          <Input
            ref={chatInputRef}
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            placeholder="Ask me to customize your email..."
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendChatMessage();
              }
            }}
            disabled={isChatLoading}
            autoComplete="off"
            autoFocus={showAIChat}
          />
          <Button 
            onClick={handleSendChatMessage}
            disabled={!currentMessage.trim() || isChatLoading}
            size="sm"
            className="px-3"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

AIChatInterface.displayName = 'AIChatInterface';

export function EmailBeautifyDialog({
  isOpen,
  onClose,
  message,
  subject,
  onConfirm,
  orgName = 'Your Organization'
}: EmailBeautifyDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [plainTextFallback, setPlainTextFallback] = useState<string>('');
  const [aiEnhancements, setAiEnhancements] = useState<AIEnhancements | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('professional');
  const [availableTemplates, setAvailableTemplates] = useState<EmailTemplate[]>([]);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [previewKey, setPreviewKey] = useState(0);
  const [showAIChat, setShowAIChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatInputRef = useRef<HTMLInputElement>(null);

  // Load available templates
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const response = await fetch('/api/email-beautify');
        if (response.ok) {
          const data = await response.json();
          setAvailableTemplates(data.templates || []);
        }
      } catch (error) {
        console.error('Failed to load templates:', error);
      }
    };

    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  // Focus chat input when chat opens
  useEffect(() => {
    if (showAIChat && chatInputRef.current) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        chatInputRef.current?.focus();
      }, 100);
    }
  }, [showAIChat]);

  const handleBeautify = useCallback(async () => {
    if (!message || !subject) {
      setError('Message and subject are required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/email-beautify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          subject,
          template: selectedTemplate,
          orgName
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to beautify email');
      }

      const data = await response.json();
      setHtmlContent(data.htmlContent);
      setPlainTextFallback(data.plainTextFallback);
      setAiEnhancements(data.aiEnhancements);
      setPreviewKey(prev => prev + 1); // Force iframe reload
    } catch (error) {
      console.error('Error beautifying email:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [message, subject, selectedTemplate, orgName]);

  // Auto-beautify when dialog opens or template changes
  useEffect(() => {
    if (isOpen && message && subject) {
      handleBeautify();
    }
  }, [isOpen, selectedTemplate, message, subject, handleBeautify]);

  const handleConfirm = () => {
    if (htmlContent && aiEnhancements) {
      onConfirm(htmlContent, plainTextFallback, aiEnhancements.enhancedSubject);
      onClose();
    }
  };

  const handleSendChatMessage = useCallback(async () => {
    if (!currentMessage.trim() || !htmlContent) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: currentMessage,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsChatLoading(true);

    // Maintain focus on input after clearing message
    setTimeout(() => {
      chatInputRef.current?.focus();
    }, 0);

    try {
      const response = await fetch('/api/ai-assist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentMessage,
          context: {
            currentHtml: htmlContent,
            subject: aiEnhancements?.enhancedSubject || subject,
            template: selectedTemplate,
            orgName
          },
          type: 'email_customization'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, assistantMessage]);

      // If the AI provided updated HTML content, apply it
      if (data.updatedHtml) {
        setHtmlContent(data.updatedHtml);
        setPreviewKey(prev => prev + 1);
      }

      if (data.updatedEnhancements) {
        setAiEnhancements(data.updatedEnhancements);
      }
    } catch (error) {
      console.error('Error in AI chat:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
      // Restore focus after AI response
      setTimeout(() => {
        chatInputRef.current?.focus();
      }, 100);
    }
  }, [currentMessage, htmlContent, aiEnhancements, subject, selectedTemplate, orgName]);

  const TemplateSelector = () => (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Palette className="h-4 w-4" />
        <span className="text-sm font-medium">Email Template</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {availableTemplates.map((template) => (
          <Card
            key={template.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-sm text-center py-0 ${
              selectedTemplate === template.id
                ? 'ring-2 ring-blue-500 bg-blue-50 shadow-sm'
                : 'hover:bg-gray-50 border-gray-200'
            }`}
            onClick={() => setSelectedTemplate(template.id)}
          >
            <CardContent className="p-2">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm truncate pr-1">{template.name}</span>
                {selectedTemplate === template.id && (
                  <CheckCircle2 className="h-3 w-3 text-blue-500 flex-shrink-0" />
                )}
              </div>
              <div className="flex justify-center space-x-1">
                {Object.values(template.colors).slice(0, 3).map((color, index) => (
                  <div
                    key={index}
                    className="w-2 h-2 rounded-full border border-gray-200 flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const PreviewControls = () => (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-2">
        <Eye className="h-4 w-4" />
        <span className="text-sm font-medium">Preview</span>
      </div>
      <div className="flex items-center space-x-1 sm:space-x-2">
        <Button
          variant={viewMode === 'desktop' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('desktop')}
          className="px-2 sm:px-3"
        >
          <Monitor className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
          <span className="hidden sm:inline">Desktop</span>
        </Button>
        <Button
          variant={viewMode === 'mobile' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('mobile')}
          className="px-2 sm:px-3"
        >
          <Smartphone className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
          <span className="hidden sm:inline">Mobile</span>
        </Button>
      </div>
    </div>
  );

  const EnhancementsSummary = () => {
    if (!aiEnhancements) return null;

    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <Sparkles className="h-4 w-4 mr-2 text-yellow-500" />
            AI Enhancements Applied
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <span className="text-sm font-medium text-gray-600">Enhanced Subject:</span>
            <p className="text-sm bg-blue-50 p-2 rounded mt-1">
              {aiEnhancements.enhancedSubject}
            </p>
          </div>
          {aiEnhancements.subtitle && (
            <div>
              <span className="text-sm font-medium text-gray-600">Header Subtitle:</span>
              <p className="text-sm bg-green-50 p-2 rounded mt-1">
                {aiEnhancements.subtitle}
              </p>
            </div>
          )}
          <div className="text-xs text-gray-500">
            ✨ Content formatted with proper headings, emphasis, and structure
          </div>
        </CardContent>
      </Card>
    );
  };



  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-6xl lg:max-w-7xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-yellow-500" />
            Beautify Email
          </DialogTitle>
          <DialogDescription>
            Transform your plain text email into a beautiful, professional HTML email with AI-powered enhancements.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col lg:grid lg:grid-cols-3 gap-4 lg:gap-6 overflow-hidden">
          {/* Left Panel - Controls */}
          <div className="lg:col-span-1 space-y-4 lg:space-y-6 overflow-y-auto max-h-60 lg:max-h-none">
            <TemplateSelector />
            
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button
                  onClick={handleBeautify}
                  disabled={isLoading}
                  className="flex-1"
                  variant="outline"
                  size="sm"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
                      <span className="text-xs sm:text-sm">Beautify</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      <span className="text-xs sm:text-sm">Regenerate</span>
                    </>
                  )}
                </Button>
                
                {htmlContent && (
                  <Button
                    onClick={() => setShowAIChat(!showAIChat)}
                    disabled={isLoading}
                    className="flex-1"
                    variant={showAIChat ? "default" : "outline"}
                    size="sm"
                  >
                    <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="text-xs sm:text-sm">AI Chat</span>
                  </Button>
                )}
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}

            <AIChatInterface 
              showAIChat={showAIChat}
              setShowAIChat={setShowAIChat}
              chatMessages={chatMessages}
              currentMessage={currentMessage}
              setCurrentMessage={setCurrentMessage}
              isChatLoading={isChatLoading}
              handleSendChatMessage={handleSendChatMessage}
              chatInputRef={chatInputRef}
            />
            
            <EnhancementsSummary />
          </div>

          {/* Right Panel - Preview */}
          <div className="lg:col-span-2 flex flex-col overflow-hidden flex-1">
            <PreviewControls />
            
            <div className="flex-1 overflow-hidden">
              <Tabs defaultValue="preview" className="h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="preview" className="flex items-center">
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </TabsTrigger>
                  <TabsTrigger value="code" className="flex items-center">
                    <Code className="h-4 w-4 mr-1" />
                    HTML Source
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="preview" className="flex-1 mt-4">
                  <div 
                    className={`border rounded-lg overflow-hidden transition-all ${
                      viewMode === 'mobile' ? 'max-w-sm mx-auto' : 'w-full'
                    }`}
                    style={{ height: 'calc(100vh - 300px)' }}
                  >
                    {htmlContent ? (
                      <iframe
                        key={previewKey}
                        srcDoc={htmlContent}
                        className="w-full h-full"
                        title="Email Preview"
                        style={{
                          border: 'none',
                          width: viewMode === 'mobile' ? '375px' : '100%',
                          height: '100%'
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-gray-50">
                        <div className="text-center text-gray-500">
                          <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Email preview will appear here</p>
                          <p className="text-sm">Select a template to get started</p>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="code" className="flex-1 mt-4">
                  <div 
                    className="border rounded-lg overflow-hidden"
                    style={{ height: 'calc(100vh - 300px)' }}
                  >
                    <pre className="h-full p-4 text-xs bg-gray-50 overflow-auto whitespace-pre-wrap">
                      <code>{htmlContent || 'HTML code will appear here after beautification'}</code>
                    </pre>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {htmlContent && (
              <Badge variant="secondary" className="flex items-center">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Email Ready
              </Badge>
            )}
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm} 
              disabled={!htmlContent || isLoading}
              className="flex items-center"
            >
              <Mail className="h-4 w-4 mr-2" />
              Use This Email
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
