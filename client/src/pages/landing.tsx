import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, MessageCircle, Heart } from "lucide-react";
import { HonorableMentionsModal } from "@/components/honorable-mentions-modal";

interface LandingProps {
  onEnter: () => void;
}

export default function Landing({ onEnter }: LandingProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted pink:from-pink-50 pink:to-pink-100 flex items-center justify-center pt-16">
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

        {/* Honorable Mentions Button */}
        <div className="mt-12 text-center">
          <HonorableMentionsModal />
        </div>

        {/* About The Developer Section */}
        <div className="mt-20 max-w-4xl mx-auto">
          <Card className="border-none shadow-2xl bg-card/50 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-0">
              {/* Header with gradient */}
              <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 text-center text-white">
                <h2 className="text-4xl font-bold mb-2">About The Developer</h2>
                <div className="w-24 h-1 bg-white/30 mx-auto rounded-full"></div>
              </div>

              <div className="p-8 lg:p-12">
                {/* Profile Section */}
                <div className="text-center mb-12">
                  <div className="relative inline-block mb-6">
                    <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-gradient-to-r from-indigo-500 to-purple-500 shadow-xl">
                      <img 
                        src="/attached_assets/received_775974028233851_1756012090253.jpeg" 
                        alt="ZEKE - Developer"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/src/assets/avatar-fallback.png";
                        }}
                      />
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                      <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  
                  <h3 className="text-5xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2 tracking-tight">
                    ZEKE
                  </h3>
                  <p className="text-lg text-gray-600 dark:text-gray-400 font-medium tracking-wider mb-6">
                    EZEKIEL D. CUNANAN
                  </p>
                  
                  <div className="max-w-3xl mx-auto mb-8">
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
                      A 16-year-old visionary creator born in 2009, passionate about inspiring others through technology and art. 
                      With an insatiable curiosity for innovation and a drive to push creative boundaries, I transform ideas into 
                      digital experiences that connect hearts and minds across the world.
                    </p>
                  </div>
                </div>

                {/* Skills Portfolio Grid */}
                <div className="mb-12">
                  <h4 className="text-2xl font-bold text-center mb-8 text-gray-800 dark:text-gray-200">
                    Creative Arsenal & Expertise
                  </h4>
                  
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Visual Arts */}
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-xl border border-purple-200 dark:border-purple-700 hover:shadow-lg transition-all duration-300">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-4">
                        <span className="text-white text-xl">🎨</span>
                      </div>
                      <h5 className="font-bold text-lg mb-3 text-purple-700 dark:text-purple-300">Visual Arts</h5>
                      <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                        <li>• Photography & Cinematography</li>
                        <li>• Digital & Traditional Art</li>
                        <li>• Graphic Design</li>
                        <li>• Motion Graphics & Animation</li>
                      </ul>
                    </div>

                    {/* Development */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-700 hover:shadow-lg transition-all duration-300">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mb-4">
                        <span className="text-white text-xl">💻</span>
                      </div>
                      <h5 className="font-bold text-lg mb-3 text-blue-700 dark:text-blue-300">Development</h5>
                      <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                        <li>• Web Development</li>
                        <li>• Game Development (2D Pixel)</li>
                        <li>• Discord Bot Development</li>
                        <li>• Minecraft Add-ons</li>
                      </ul>
                    </div>

                    {/* Content & Media */}
                    <div className="bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 p-6 rounded-xl border border-green-200 dark:border-green-700 hover:shadow-lg transition-all duration-300">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center mb-4">
                        <span className="text-white text-xl">📝</span>
                      </div>
                      <h5 className="font-bold text-lg mb-3 text-green-700 dark:text-green-300">Content & Media</h5>
                      <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                        <li>• Author & Writer</li>
                        <li>• Poetry & Creative Writing</li>
                        <li>• Content Creation</li>
                        <li>• Voice Acting</li>
                      </ul>
                    </div>

                    {/* Animation Tools */}
                    <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 p-6 rounded-xl border border-orange-200 dark:border-orange-700 hover:shadow-lg transition-all duration-300">
                      <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center mb-4">
                        <span className="text-white text-xl">🎬</span>
                      </div>
                      <h5 className="font-bold text-lg mb-3 text-orange-700 dark:text-orange-300">Animation Tools</h5>
                      <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                        <li>• Flipaclip & Sticknodes</li>
                        <li>• Adobe Flash</li>
                        <li>• RoughAnimator</li>
                        <li>• Motion Graphics</li>
                      </ul>
                    </div>

                    {/* Music & Audio */}
                    <div className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 p-6 rounded-xl border border-yellow-200 dark:border-yellow-700 hover:shadow-lg transition-all duration-300">
                      <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-lg flex items-center justify-center mb-4">
                        <span className="text-white text-xl">🎵</span>
                      </div>
                      <h5 className="font-bold text-lg mb-3 text-yellow-700 dark:text-yellow-300">Music & Audio</h5>
                      <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                        <li>• Former Musician</li>
                        <li>• Voice Acting</li>
                        <li>• Audio Production</li>
                        <li>• Creative Direction</li>
                      </ul>
                    </div>

                    {/* Published Works */}
                    <div className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 p-6 rounded-xl border border-pink-200 dark:border-pink-700 hover:shadow-lg transition-all duration-300">
                      <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg flex items-center justify-center mb-4">
                        <span className="text-white text-xl">📚</span>
                      </div>
                      <h5 className="font-bold text-lg mb-3 text-pink-700 dark:text-pink-300">Published Works</h5>
                      <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                        <li>• Wattpad Author</li>
                        <li>• "You Are A Poem And The World Is Reading You"</li>
                        <li>• Self-Development Book</li>
                        <li>• Poetry Collections</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Mission Statement */}
                <div className="text-center bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20 rounded-2xl p-8 border border-indigo-200 dark:border-indigo-700">
                  <h4 className="text-2xl font-bold mb-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Mission & Vision
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300 italic text-lg leading-relaxed max-w-3xl mx-auto">
                    "To inspire and empower others through creative technology, meaningful storytelling, and authentic human connection. 
                    Every project I create is a step toward building a more connected, understanding, and beautiful digital world where 
                    creativity knows no bounds and every voice matters."
                  </p>
                  <div className="mt-6 flex justify-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                    <span className="px-3 py-1 bg-white/50 dark:bg-gray-800/50 rounded-full">Creative Visionary</span>
                    <span className="px-3 py-1 bg-white/50 dark:bg-gray-800/50 rounded-full">Digital Artist</span>
                    <span className="px-3 py-1 bg-white/50 dark:bg-gray-800/50 rounded-full">Tech Innovator</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
