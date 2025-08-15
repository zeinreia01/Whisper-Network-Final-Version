import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, MessageCircle, Heart } from "lucide-react";
import { HonorableMentionsModal } from "@/components/honorable-mentions-modal";

interface LandingProps {
  onEnter: () => void;
}

export default function Landing({ onEnter }: LandingProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted pink:from-pink-50 pink:to-pink-100 flex items-center justify-center">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <div className="space-y-10">
          {/* Logo/Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-card shadow-lg rounded-2xl flex items-center justify-center border border-border">
              <MessageCircle className="w-10 h-10 text-foreground" />
            </div>
          </div>
          
          {/* Main Title */}
          <div className="space-y-4">
            <h1 className="text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight lowercase" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              whisper network
            </h1>
            <div className="w-16 h-px bg-border mx-auto"></div>
          </div>
          
          {/* Subtitle */}
          <p className="text-lg text-muted-foreground font-light max-w-xl mx-auto leading-relaxed">
            Where Silent Messengers share thoughts and Whisper Listeners provide guidance in a space of understanding
          </p>
          
          {/* CTA Button */}
          <div className="pt-6">
            <Button 
              onClick={onEnter}
              size="lg"
              className="group px-8 py-3 text-base font-medium transition-all duration-300 shadow-lg hover:shadow-xl pink:elegant-button"
            >
              Enter the Network
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
          
          {/* Simple feature list */}
          <div className="pt-8">
            <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground font-medium">
              <span>Anonymous</span>
              <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
              <span>Safe</span>
              <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
              <span>Supportive</span>
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="mt-20 max-w-6xl mx-auto">
          <Card className="border-none shadow-2xl bg-card/50 pink:romantic-card backdrop-blur-sm pink:pink-glow">
            <CardContent className="p-8 lg:p-12">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-6 page-title">
                  About Whispering Network
                </h2>
                <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-blue-500 mx-auto rounded-full"></div>
              </div>

              <div className="max-w-4xl mx-auto">
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 mb-8 border border-purple-100 dark:border-gray-700">
                  <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Creator's Vision</h3>
                  <blockquote className="text-lg italic leading-relaxed text-gray-700 dark:text-gray-300 border-l-4 border-purple-400 pl-6 message-text">
                    "I wanted to create a space where connection transcends visibility—where voices unite not through faces, but through the raw authenticity of shared experience. In a world that demands we be seen to be heard, I envisioned a sanctuary where anonymity becomes strength, where vulnerability finds safety, and where the whispers of the heart can echo without judgment.
                    <br/><br/>
                    This is a place where souls can open without having to shatter, where the silent can finally speak, and where the deepest truths find their way to listening hearts. Every whisper here carries the weight of human experience, every reply the warmth of genuine understanding.
                    <br/><br/>
                    In the dance between darkness and light, between speaking and listening, we discover that sometimes the most profound connections happen when we remove the masks and simply exist as we are—imperfect, searching, beautifully human."
                  </blockquote>
                  <div className="mt-6 text-right">
                    <p className="text-gray-600 dark:text-gray-400 font-serif">— Zeke, Creator of Whisper Network</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                    <h4 className="text-lg font-semibold mb-3 text-purple-600 dark:text-purple-400">The Philosophy</h4>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      Born from the understanding that authentic connection requires courage, not visibility. 
                      In anonymity, we find freedom. In listening, we discover empathy. In sharing, we heal together.
                    </p>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                    <h4 className="text-lg font-semibold mb-3 text-blue-600 dark:text-blue-400">The Mission</h4>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      To provide a digital sanctuary where every whisper matters, every story has value, 
                      and every person finds solace in the knowledge that they are not alone in their journey.
                    </p>
                  </div>
                </div>

                <div className="text-center bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 pink:from-pink-100 pink:to-red-100 rounded-xl p-6 border border-purple-200 dark:border-purple-700 pink:border-pink-200">
                  <p className="text-gray-600 dark:text-gray-400 pink:text-pink-700 italic">
                    "In every whisper shared, in every heart that listens, in every moment of genuine connection—
                    we prove that humanity's greatest strength lies not in being seen, but in truly seeing others."
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Honorable Mentions Button at the bottom */}
        <div className="mt-12 text-center">
          <HonorableMentionsModal />
        </div>
      </div>
    </div>
  );
}
