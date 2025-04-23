import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
    Wand2,
    RefreshCw,
    ArrowUpDown,
    Expand,
    Shrink,
    FileText,
    Smile,
    Sparkles,
    Loader2
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '../ui/dropdown-menu';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface AIMessageAssistantProps {
    message: string;
    onMessageChange: (message: string) => void;
    placeholder?: string;
    className?: string;
}

export function AIMessageAssistant({
    message,
    onMessageChange,
    placeholder = "Enter your message here...",
    className = ""
}: AIMessageAssistantProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeTab, setActiveTab] = useState<string>("write");

    const handleAIAssist = async (action: string) => {
        if (!message.trim()) {
            setError("Please enter a message first");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/ai-assist', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message,
                    action,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to get AI assistance');
            }

            const data = await response.json();

            if (action === 'suggest') {
                // For suggestions, we'll generate 3 different options
                setSuggestions([
                    data.message,
                    // We'll add more suggestions in a real implementation
                    "This is a placeholder suggestion 2",
                    "This is a placeholder suggestion 3"
                ]);
                setShowSuggestions(true);
            } else {
                // For other actions, directly update the message
                onMessageChange(data.message);
            }
        } catch (error) {
            console.error('Error with AI assistance:', error);
            setError(error instanceof Error ? error.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const applySuggestion = (suggestion: string) => {
        onMessageChange(suggestion);
        setShowSuggestions(false);
    };

    return (
        <div className={`space-y-4 ${className}`}>
            <Tabs defaultValue="write" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="write">Write</TabsTrigger>
                    <TabsTrigger value="ai">AI Assistant</TabsTrigger>
                </TabsList>

                <TabsContent value="write" className="space-y-4">
                    <Textarea
                        placeholder={placeholder}
                        value={message}
                        onChange={(e) => onMessageChange(e.target.value)}
                        className="min-h-[150px]"
                    />

                    <div className="flex justify-end">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" disabled={isLoading}>
                                    {isLoading ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <Wand2 className="h-4 w-4 mr-2" />
                                    )}
                                    AI Assist
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuItem onClick={() => handleAIAssist('improve')}>
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    Improve
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleAIAssist('rephrase')}>
                                    <ArrowUpDown className="h-4 w-4 mr-2" />
                                    Rephrase
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleAIAssist('expand')}>
                                    <Expand className="h-4 w-4 mr-2" />
                                    Expand
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleAIAssist('shorten')}>
                                    <Shrink className="h-4 w-4 mr-2" />
                                    Shorten
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleAIAssist('formal')}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    Make Formal
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleAIAssist('casual')}>
                                    <Smile className="h-4 w-4 mr-2" />
                                    Make Casual
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleAIAssist('suggest')}>
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Get Suggestions
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </TabsContent>

                <TabsContent value="ai" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>AI Message Generator</CardTitle>
                            <CardDescription>
                                Let AI help you write your message
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Textarea
                                placeholder="Describe what you want to write about..."
                                value={message}
                                onChange={(e) => onMessageChange(e.target.value)}
                                className="min-h-[100px]"
                            />

                            <Button
                                className="w-full"
                                onClick={() => handleAIAssist('generate')}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="h-4 w-4 mr-2" />
                                        Generate Message
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {showSuggestions && (
                <Card>
                    <CardHeader>
                        <CardTitle>AI Suggestions</CardTitle>
                        <CardDescription>
                            Choose one of these suggestions or write your own
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {suggestions.map((suggestion, index) => (
                            <div key={index} className="p-4 border rounded-md hover:bg-gray-50 cursor-pointer" onClick={() => applySuggestion(suggestion)}>
                                <p className="text-sm">{suggestion}</p>
                            </div>
                        ))}
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" onClick={() => setShowSuggestions(false)}>
                            Cancel
                        </Button>
                    </CardFooter>
                </Card>
            )}
        </div>
    );
} 