import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Phone, MessageCircle, Clock, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const SupportPage = () => {
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate sending message
    setTimeout(() => {
      toast.success('Message sent! We\'ll get back to you soon.');
      setSubject('');
      setMessage('');
      setIsSubmitting(false);
    }, 1500);
  };

  const supportChannels = [
    { icon: Phone, title: 'Call Us', info: '+254 700 123 456', availability: '24/7', action: 'tel:+254700123456' },
    { icon: Mail, title: 'Email Us', info: 'support@valhala.com', availability: '24/7', action: 'mailto:support@valhala.com' },
    { icon: MessageCircle, title: 'Live Chat', info: 'Available now', availability: '9 AM - 9 PM', action: '#' },
    { icon: Clock, title: 'WhatsApp', info: '+254 700 123 456', availability: '9 AM - 9 PM', action: 'https://wa.me/254700123456' },
  ];

  const faqs = [
    {
      question: 'How long does delivery take?',
      answer: 'Delivery typically takes 30-45 minutes depending on your location and traffic conditions.'
    },
    {
      question: 'What payment methods are accepted?',
      answer: 'We accept M-Pesa, Visa, Mastercard, and cash on delivery. You pay 50% upfront and 50% upon delivery.'
    },
    {
      question: 'Can I cancel my order?',
      answer: 'Orders can be cancelled within 5 minutes of placement. After that, cancellations are subject to review.'
    },
    {
      question: 'What if my order is incorrect or damaged?',
      answer: 'Please report any issues through the Order Tracking page or contact our support team immediately.'
    },
    {
      question: 'Do you deliver alcohol to minors?',
      answer: 'No. We strictly verify age at delivery. You must provide valid ID showing you are 18+ years old.'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Customer Support</h1>
      <p className="text-gray-400 mb-8">We're here to help! Choose your preferred way to reach us.</p>
      
      {/* Support Channels */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {supportChannels.map((channel, index) => (
          <motion.a
            key={index}
            href={channel.action}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-valhala-secondary rounded-xl p-4 text-center hover:transform hover:scale-105 transition-all duration-300"
          >
            <channel.icon className="mx-auto mb-3 text-valhala-accent" size={32} />
            <h3 className="font-semibold mb-1">{channel.title}</h3>
            <p className="text-sm text-valhala-gold font-semibold">{channel.info}</p>
            <p className="text-xs text-gray-400 mt-2">{channel.availability}</p>
          </motion.a>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Contact Form */}
        <div className="bg-valhala-secondary rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">Send us a Message</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="input-primary"
                placeholder="How can we help you?"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="input-primary"
                rows="5"
                placeholder="Please describe your issue or question..."
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Send size={18} />
                  Send Message
                </>
              )}
            </button>
          </form>
        </div>
        
        {/* FAQs */}
        <div className="bg-valhala-secondary rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-valhala-nordic pb-3">
                <h3 className="font-semibold mb-2 text-valhala-gold">{faq.question}</h3>
                <p className="text-sm text-gray-400">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Emergency Contact */}
      <div className="mt-8 bg-gradient-to-r from-red-500/20 to-valhala-accent/20 rounded-xl p-6 text-center">
        <h3 className="text-lg font-bold mb-2">Urgent Issue?</h3>
        <p className="text-gray-300 mb-3">For immediate assistance with your order</p>
        <a href="tel:+254700123456" className="btn-primary inline-flex items-center gap-2">
          <Phone size={18} />
          Call Support Hotline
        </a>
      </div>
    </div>
  );
};

export default SupportPage;