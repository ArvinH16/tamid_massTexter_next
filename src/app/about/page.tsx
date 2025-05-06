'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { motion } from "framer-motion";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto space-y-12"
        >
          <div className="text-center space-y-6">
            <motion.h1 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="text-4xl md:text-6xl font-bold tracking-tight"
            >
              <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-blue-600 bg-clip-text text-transparent">
                Mass Texter
              </span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-lg md:text-xl text-gray-300"
            >
              The Ultimate Communication Platform for Organizations
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-xl md:text-2xl bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">What We Offer</CardTitle>
                <CardDescription className="text-base text-gray-300">
                  A powerful, all-in-one platform for seamless mass communication
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-base text-gray-300">
                  Mass Texter is a revolutionary communication platform that combines the power of mass texting and email capabilities in one intuitive interface. Perfect for campus organizations, clubs, and businesses, our platform streamlines your communication needs with cutting-edge features and user-friendly design.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              <Card className="bg-white/5 backdrop-blur-sm border-white/10 h-full">
                <CardHeader>
                  <CardTitle className="text-xl md:text-2xl bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Key Features</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <ul className="space-y-3 text-base text-gray-300">
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                      <span>Intelligent file upload with AI-powered column matching</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                      <span>Support for Excel and CSV files</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                      <span>Unified platform for both SMS and email</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                      <span>Smart contact management</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                      <span>Real-time delivery tracking</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              <Card className="bg-white/5 backdrop-blur-sm border-white/10 h-full">
                <CardHeader>
                  <CardTitle className="text-xl md:text-2xl bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Perfect For</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <ul className="space-y-3 text-base text-gray-300">
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                      <span>Campus organizations and clubs</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                      <span>Student government bodies</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                      <span>Small businesses and startups</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                      <span>Event organizers</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                      <span>Non-profit organizations</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
          >
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-xl md:text-2xl bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Why Choose Mass Texter</CardTitle>
                <CardDescription className="text-base text-gray-300">
                  Experience the future of organizational communication
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-base text-gray-300">
                  Our platform stands out with its intelligent file processing capabilities. Simply upload your Excel or CSV files, and our AI technology automatically matches columns and organizes your contact data. This smart approach saves you time and eliminates manual data entry errors. Whether you&apos;re managing a campus organization, running a business, or coordinating events, Mass Texter provides the tools you need to communicate effectively with your audience.
                </p>
                <div className="flex justify-center">
                  <Link
                    href="/"
                    className="bg-gradient-to-r from-blue-600 via-purple-500 to-blue-800 text-white px-10 py-4 rounded-xl text-base font-semibold shadow-lg hover:shadow-purple-600/30 transition-all duration-300 transform hover:scale-105"
                  >
                    Get Started Now
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
          >
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-xl md:text-2xl bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Contact Us</CardTitle>
                <CardDescription className="text-base text-gray-300">
                  Have questions? We&apos;re here to help!
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <p className="text-base text-gray-300">
                    For any further questions, please email us at:
                  </p>
                  <a 
                    href="mailto:arvin@hakakian.me"
                    className="inline-block text-base font-medium text-purple-400 hover:text-purple-300 transition-colors duration-200"
                  >
                    arvin@hakakian.me
                  </a>
                </div>
                
                <div className="space-y-4">
                  <p className="text-base text-gray-300">
                    Connect with us on LinkedIn:
                  </p>
                  <a 
                    href="https://www.linkedin.com/in/arvin-hakakian/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-base font-medium text-purple-400 hover:text-purple-300 transition-colors duration-200"
                  >
                    Arvin Hakakian
                  </a>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
} 