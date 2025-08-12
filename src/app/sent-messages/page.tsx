'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Search, Mail, MessageSquare, Calendar, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import AnimatedBackground from '@/components/AnimatedBackground';

interface TextMessage {
  id: number;
  created_at: string;
  content: string;
  receiver: string;
}

interface EmailMessage {
  id: number;
  created_at: string;
  content: string;
  subject: string;
  receiver: string;
}

interface SentMessagesData {
  texts: TextMessage[];
  emails: EmailMessage[];
  pagination: {
    page: number;
    limit: number;
    totalTexts: number;
    totalEmails: number;
    totalPagesTexts: number;
    totalPagesEmails: number;
  };
}

export default function SentMessagesPage() {
  const router = useRouter();
  const [data, setData] = useState<SentMessagesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'texts' | 'emails'>('texts');
  const [currentPage, setCurrentPage] = useState(1);
  const [orgInfo, setOrgInfo] = useState<{ id: number; name: string } | null>(null);

  // Fetch organization info and verify authentication
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const response = await fetch('/api/verify-auth', {
          method: 'GET',
          credentials: 'include',
        });
        
        if (!response.ok) {
          router.push('/');
          return;
        }

        const authData = await response.json();
        if (authData.success) {
          setOrgInfo({
            id: authData.organizationId,
            name: authData.chapterName
          });
        }
      } catch {
        router.push('/');
      }
    };

    verifyAuth();
  }, [router]);

  // Fetch sent messages data
  const fetchData = async (page = 1, type: 'texts' | 'emails' | 'all' = 'all') => {
    try {
      setLoading(true);
      const response = await fetch(`/api/sent-messages?type=${type}&page=${page}&limit=20`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Error fetching sent messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orgInfo) {
      fetchData(currentPage, 'all');
    }
  }, [orgInfo, currentPage]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };



  const filteredTexts = data?.texts.filter(text =>
    text.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    text.receiver.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredEmails = data?.emails.filter(email =>
    email.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    email.receiver.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handlePageChange = (newPage: number, type: 'texts' | 'emails') => {
    setCurrentPage(newPage);
    fetchData(newPage, type);
  };

  const PaginationControls = ({ 
    currentPage, 
    totalPages, 
    onPageChange, 
    type 
  }: { 
    currentPage: number; 
    totalPages: number; 
    onPageChange: (page: number, type: 'texts' | 'emails') => void;
    type: 'texts' | 'emails';
  }) => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-center space-x-2 mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1, type)}
          disabled={currentPage <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        
        <span className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </span>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1, type)}
          disabled={currentPage >= totalPages}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  if (loading && !data) {
    return (
      <AnimatedBackground>
        <div className="container mx-auto p-4 max-w-4xl flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading sent messages...</p>
          </div>
        </div>
      </AnimatedBackground>
    );
  }

  return (
    <AnimatedBackground>
      <div className="container mx-auto p-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Sent Messages</h1>
          <Button
            variant="outline"
            onClick={() => router.push('/mass-text')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Button>
        </div>
        
        {orgInfo?.name && (
          <p className="text-gray-600 mb-6">
            View all messages sent by {orgInfo.name}
          </p>
        )}

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search messages, recipients (phone/email), or content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Text Messages</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.pagination.totalTexts || 0}</div>
              <p className="text-xs text-muted-foreground">
                Messages sent to your organization members
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Emails</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.pagination.totalEmails || 0}</div>
              <p className="text-xs text-muted-foreground">
                Emails sent to your organization members
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Messages Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Message History</CardTitle>
            <CardDescription>
              Browse through all text messages and emails sent by your organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'texts' | 'emails')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="texts" className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>Text Messages ({filteredTexts.length})</span>
                </TabsTrigger>
                <TabsTrigger value="emails" className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>Emails ({filteredEmails.length})</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="texts" className="space-y-4">
                {filteredTexts.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No text messages found.</p>
                  </div>
                ) : (
                  <>
                    {filteredTexts.map((text) => (
                      <Card key={text.id} className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center space-x-2">
                            <MessageSquare className="h-4 w-4 text-gray-400" />
                            <span className="font-semibold">
                              {text.receiver}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(text.created_at)}</span>
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-gray-700">{text.content}</p>
                        </div>
                      </Card>
                    ))}
                    <PaginationControls
                      currentPage={currentPage}
                      totalPages={data?.pagination.totalPagesTexts || 1}
                      onPageChange={handlePageChange}
                      type="texts"
                    />
                  </>
                )}
              </TabsContent>

              <TabsContent value="emails" className="space-y-4">
                {filteredEmails.length === 0 ? (
                  <div className="text-center py-8">
                    <Mail className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No emails found.</p>
                  </div>
                ) : (
                  <>
                    {filteredEmails.map((email) => (
                      <Card key={email.id} className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="font-semibold">
                              {email.receiver}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(email.created_at)}</span>
                          </div>
                        </div>
                        <div className="mb-2">
                          <h4 className="font-semibold text-gray-900">Subject: {email.subject}</h4>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-gray-700 whitespace-pre-wrap">{email.content}</p>
                        </div>
                      </Card>
                    ))}
                    <PaginationControls
                      currentPage={currentPage}
                      totalPages={data?.pagination.totalPagesEmails || 1}
                      onPageChange={handlePageChange}
                      type="emails"
                    />
                  </>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AnimatedBackground>
  );
}
