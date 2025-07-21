import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Info, Heart, Shield, Users, Eye, Lock } from "lucide-react";

interface InfoDialogProps {
  trigger?: React.ReactNode;
}

export function InfoDialog({ trigger }: InfoDialogProps) {
  const defaultTrigger = (
    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Information & Guidelines">
      <Info className="h-4 w-4" />
    </Button>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] w-[95vw] sm:w-full overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Heart className="h-5 w-5 text-primary" />
            <span>Welcome to Whispering Network</span>
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] max-h-[70vh] pr-4 overflow-y-auto">
          <div className="space-y-6">
            
            {/* Introduction */}
            <section>
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <Users className="h-4 w-4 mr-2 text-blue-600" />
                What is Whispering Network?
              </h3>
              <div className="space-y-2 text-sm text-gray-700">
                <p>
                  Whispering Network is a compassionate digital sanctuary for anonymous emotional expression. 
                  Here, you can share your thoughts, feelings, and experiences in a safe, supportive environment 
                  where your privacy is protected and your voice matters.
                </p>
                <p>
                  Whether you need advice, want to share a confession, express love, or simply vent about life, 
                  our community of <strong>Silent Messengers</strong> is here to listen without judgment.
                </p>
              </div>
            </section>

            {/* How to Use */}
            <section>
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <Shield className="h-4 w-4 mr-2 text-green-600" />
                How to Use the Platform
              </h3>
              <div className="space-y-3 text-sm text-gray-700">
                <div>
                  <h4 className="font-medium text-gray-900">As an Anonymous Visitor:</h4>
                  <ul className="list-disc list-inside mt-1 space-y-1 ml-4">
                    <li>Create public messages that everyone can see</li>
                    <li>Reply to messages with any nickname you choose</li>
                    <li>Browse messages by category</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">As a Silent Messenger (Registered User):</h4>
                  <ul className="list-disc list-inside mt-1 space-y-1 ml-4">
                    <li>Your username automatically fills in when replying (no need to type nicknames)</li>
                    <li>Manage replies on your own messages</li>
                    <li>Send private messages to Whisper Listeners</li>
                    <li>Build a consistent identity while staying anonymous to the public</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Message Categories:</h4>
                  <ul className="list-disc list-inside mt-1 space-y-1 ml-4">
                    <li><span className="font-medium">Love:</span> Share romantic feelings, relationships, crushes</li>
                    <li><span className="font-medium">Advice:</span> Seek guidance or share wisdom</li>
                    <li><span className="font-medium">Confession:</span> Share secrets or personal truths</li>
                    <li><span className="font-medium">Rant:</span> Express frustrations or complaints</li>
                    <li><span className="font-medium">Reflection:</span> Share thoughts, insights, or philosophical ideas</li>
                    <li><span className="font-medium">Writing:</span> Creative writing, poems, stories</li>
                    <li><span className="font-medium">Anything:</span> Everything else</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Community Guidelines */}
            <section>
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <Heart className="h-4 w-4 mr-2 text-pink-600" />
                Community Guidelines
              </h3>
              <div className="space-y-2 text-sm text-gray-700">
                <div>
                  <h4 className="font-medium text-green-700 mb-1">✓ Please DO:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Be kind, respectful, and supportive</li>
                    <li>Share genuine thoughts and experiences</li>
                    <li>Offer constructive advice when appropriate</li>
                    <li>Respect others' anonymity and privacy</li>
                    <li>Use content warnings for sensitive topics</li>
                    <li>Report inappropriate content to our Whisper Listeners</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-red-700 mb-1">✗ Please DON'T:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Share personal information (yours or others')</li>
                    <li>Post hate speech, harassment, or discriminatory content</li>
                    <li>Share explicit sexual content or illegal material</li>
                    <li>Spam, advertise, or post unrelated content</li>
                    <li>Try to identify other users or share personal details</li>
                    <li>Use the platform to harm yourself or others</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Safety & Support */}
            <section>
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <Shield className="h-4 w-4 mr-2 text-purple-600" />
                Safety & Support
              </h3>
              <div className="space-y-2 text-sm text-gray-700">
                <p>
                  If you're experiencing a mental health crisis or having thoughts of self-harm, 
                  please reach out to professional help immediately:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>Crisis Text Line:</strong> Text HOME to 741741</li>
                  <li><strong>National Suicide Prevention Lifeline:</strong> 988</li>
                  <li><strong>International Association for Suicide Prevention:</strong> iasp.info</li>
                </ul>
                <p>
                  Our <strong>Whisper Listeners</strong> (moderators) are here to help maintain a safe space, 
                  but they are not trained counselors. For serious issues, please seek professional support.
                </p>
              </div>
            </section>

            {/* Privacy & Terms */}
            <section>
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <Eye className="h-4 w-4 mr-2 text-indigo-600" />
                Privacy & Data
              </h3>
              <div className="space-y-2 text-sm text-gray-700">
                <div>
                  <h4 className="font-medium text-gray-900">What We Collect:</h4>
                  <ul className="list-disc list-inside mt-1 space-y-1 ml-4">
                    <li>Username and encrypted password (for registered users)</li>
                    <li>Message content and timestamps</li>
                    <li>IP addresses for security purposes (not linked to content)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">What We DON'T Collect:</h4>
                  <ul className="list-disc list-inside mt-1 space-y-1 ml-4">
                    <li>Real names, email addresses, or personal information</li>
                    <li>Location data or tracking cookies</li>
                    <li>Social media profiles or external accounts</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Your Rights:</h4>
                  <ul className="list-disc list-inside mt-1 space-y-1 ml-4">
                    <li>Request deletion of your account and all associated data</li>
                    <li>Remain completely anonymous if you choose not to register</li>
                    <li>Report content that violates our guidelines</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Terms of Agreement */}
            <section>
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <Lock className="h-4 w-4 mr-2 text-orange-600" />
                Terms of Agreement
              </h3>
              <div className="space-y-2 text-sm text-gray-700">
                <p>By using Whispering Network, you agree to:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Follow all community guidelines and respect other users</li>
                  <li>Not use the platform for illegal activities</li>
                  <li>Understand that content may be moderated for safety</li>
                  <li>Accept that usernames must be unique across all user types</li>
                  <li>Report violations and support a healthy community</li>
                  <li>Use the platform responsibly and ethically</li>
                </ul>
                <p className="mt-3 font-medium text-gray-900">
                  We reserve the right to remove content or suspend accounts that violate these terms. 
                  Our goal is to maintain a safe, supportive environment for everyone.
                </p>
              </div>
            </section>

            {/* Contact */}
            <section className="bg-muted p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Questions or Concerns?</h3>
              <p className="text-sm text-gray-700">
                Send a private message to any of our <strong>Whisper Listeners</strong> through the platform, 
                or create a public message tagged with "Advice" - our community is always here to help.
              </p>
            </section>

            {/* Developer Support */}
            <section className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 flex items-center text-blue-800">
                <Shield className="h-4 w-4 mr-2" />
                Need Help or Have Questions?
              </h3>
              <div className="space-y-2 text-sm text-blue-700">
                <p>
                  For technical support, suggestions, or any questions about the platform, 
                  feel free to reach out to our development team:
                </p>
                <div className="bg-white/60 p-3 rounded border border-blue-200">
                  <p className="font-medium">📧 Developer Support:</p>
                  <a 
                    href="mailto:whispernetworkofficial@gmail.com" 
                    className="text-blue-600 hover:text-blue-800 underline font-mono text-sm"
                  >
                    whispernetworkofficial@gmail.com
                  </a>
                </div>
                <p className="text-xs text-blue-600">
                  We welcome feedback, bug reports, feature suggestions, and any questions 
                  about using Whispering Network. Your input helps us improve the platform for everyone!
                </p>
              </div>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}