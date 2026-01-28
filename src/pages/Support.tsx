import { useState } from 'react';
import {
    Mail,
    MessageSquare,
    Send,
    CheckCircle,
    Clock,
    Headphones,
    FileQuestion,
    Bug,
    Lightbulb,
    AlertCircle,
    User,
    AtSign,
    FileText
} from 'lucide-react';

type QueryType = 'general' | 'technical' | 'bug' | 'feature' | 'billing';

interface FormData {
    name: string;
    email: string;
    queryType: QueryType;
    subject: string;
    message: string;
}

export default function Support() {
    const [formData, setFormData] = useState<FormData>({
        name: '',
        email: '',
        queryType: 'general',
        subject: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const queryTypes = [
        { id: 'general', label: 'General Inquiry', icon: MessageSquare, color: 'text-blue-500' },
        { id: 'technical', label: 'Technical Support', icon: Headphones, color: 'text-purple-500' },
        { id: 'bug', label: 'Bug Report', icon: Bug, color: 'text-red-500' },
        { id: 'feature', label: 'Feature Request', icon: Lightbulb, color: 'text-yellow-500' },
        { id: 'billing', label: 'Billing Question', icon: FileQuestion, color: 'text-green-500' }
    ];

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError(null);
    };

    const handleQueryTypeChange = (type: QueryType) => {
        setFormData(prev => ({ ...prev, queryType: type }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.name.trim()) {
            setError('Please enter your name');
            return;
        }
        if (!formData.email.trim() || !formData.email.includes('@')) {
            setError('Please enter a valid email address');
            return;
        }
        if (!formData.subject.trim()) {
            setError('Please enter a subject');
            return;
        }
        if (!formData.message.trim()) {
            setError('Please enter your message');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            // Submit to FormSubmit.co
            const response = await fetch('https://formsubmit.co/ajax/support@proofedge.io', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    _subject: `[ProofEdge ${formData.queryType.toUpperCase()}] ${formData.subject}`,
                    queryType: formData.queryType,
                    subject: formData.subject,
                    message: formData.message
                })
            });

            if (response.ok) {
                setIsSubmitted(true);
                setFormData({
                    name: '',
                    email: '',
                    queryType: 'general',
                    subject: '',
                    message: ''
                });
            } else {
                throw new Error('Failed to submit form');
            }
        } catch (err) {
            setError('Failed to send message. Please try again or email us directly at support@proofedge.io');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="flex-1 bg-gray-50 min-h-screen lg:rounded-tl-3xl overflow-hidden">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 sm:p-12 text-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                            <CheckCircle className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-3">Message Sent!</h1>
                        <p className="text-gray-600 mb-6 max-w-md mx-auto">
                            Thank you for reaching out. Our support team will get back to you within 24 hours.
                        </p>
                        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-8">
                            <Clock className="w-4 h-4" />
                            <span>Average response time: 4-6 hours</span>
                        </div>
                        <button
                            onClick={() => setIsSubmitted(false)}
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
                        >
                            Send Another Message
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 bg-gray-50 min-h-screen lg:rounded-tl-3xl overflow-hidden">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Contact Support</h1>
                    <p className="text-gray-600">
                        Have a question or need help? We're here for you. Fill out the form below and we'll get back to you as soon as possible.
                    </p>
                </div>

                {/* Contact Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                            <Mail className="w-5 h-5 text-blue-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">Email Us</h3>
                        <a href="mailto:support@proofedge.io" className="text-sm text-blue-600 hover:underline">
                            support@proofedge.io
                        </a>
                    </div>

                    <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                            <Clock className="w-5 h-5 text-purple-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">Response Time</h3>
                        <p className="text-sm text-gray-600">Within 24 hours</p>
                    </div>

                    <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                            <Headphones className="w-5 h-5 text-green-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">Priority Support</h3>
                        <p className="text-sm text-gray-600">Available for Pro plans</p>
                    </div>
                </div>

                {/* Contact Form */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    {/* Form Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                                <MessageSquare className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-white">Send us a message</h2>
                                <p className="text-sm text-blue-100">We typically respond within a few hours</p>
                            </div>
                        </div>
                    </div>

                    {/* Form Body */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Error Alert */}
                        {error && (
                            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        )}

                        {/* Query Type Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">What can we help you with?</label>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                {queryTypes.map(type => {
                                    const Icon = type.icon;
                                    const isSelected = formData.queryType === type.id;
                                    return (
                                        <button
                                            key={type.id}
                                            type="button"
                                            onClick={() => handleQueryTypeChange(type.id as QueryType)}
                                            className={`
                        p-3 rounded-xl border-2 transition-all duration-200 text-center
                        ${isSelected
                                                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                                                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                                                }
                      `}
                                        >
                                            <Icon className={`w-5 h-5 mx-auto mb-1 ${isSelected ? type.color : 'text-gray-400'}`} />
                                            <span className={`text-xs font-medium ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>
                                                {type.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Name & Email Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Your Name
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="John Doe"
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        placeholder="john@example.com"
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Subject */}
                        <div>
                            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1.5">
                                Subject
                            </label>
                            <div className="relative">
                                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    id="subject"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleInputChange}
                                    placeholder="Brief description of your inquiry"
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                />
                            </div>
                        </div>

                        {/* Message */}
                        <div>
                            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1.5">
                                Message
                            </label>
                            <textarea
                                id="message"
                                name="message"
                                value={formData.message}
                                onChange={handleInputChange}
                                rows={5}
                                placeholder="Please describe your question or issue in detail. The more information you provide, the better we can help you."
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                            />
                        </div>

                        {/* Submit Button */}
                        <div className="flex items-center justify-between pt-2">
                            <p className="text-xs text-gray-500">
                                We respect your privacy and will never share your information.
                            </p>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`
                  inline-flex items-center gap-2 px-6 py-3 
                  bg-gradient-to-r from-blue-600 to-purple-600 
                  text-white font-semibold rounded-xl
                  shadow-lg shadow-blue-500/25
                  hover:shadow-xl hover:shadow-blue-500/30
                  active:scale-[0.98]
                  transition-all duration-200
                  disabled:opacity-70 disabled:cursor-not-allowed
                `}
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Sending...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        <span>Send Message</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Additional Help */}
                <div className="mt-8 bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-6 text-white">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Headphones className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold mb-1">Need immediate help?</h3>
                            <p className="text-gray-400 text-sm">
                                Check out our Help Center for documentation, tutorials, and frequently asked questions.
                            </p>
                        </div>
                        <a
                            href="#"
                            onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/help'); window.location.reload(); }}
                            className="px-5 py-2.5 bg-white text-gray-900 rounded-xl font-semibold text-sm hover:bg-gray-100 transition-colors"
                        >
                            Visit Help Center
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
