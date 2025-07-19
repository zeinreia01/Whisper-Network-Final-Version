import { Button } from "@/components/ui/button";
import { ArrowRight, MessageCircle } from "lucide-react";

interface LandingProps {
  onEnter: () => void;
}

export default function Landing({ onEnter }: LandingProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <div className="space-y-10">
          {/* Logo/Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-white shadow-lg rounded-2xl flex items-center justify-center border border-gray-100">
              <MessageCircle className="w-10 h-10 text-gray-700" />
            </div>
          </div>
          
          {/* Main Title */}
          <div className="space-y-4">
            <h1 className="text-5xl lg:text-6xl font-light text-gray-900 tracking-tight">
              Whispering Network
            </h1>
            <div className="w-16 h-px bg-gray-300 mx-auto"></div>
          </div>
          
          {/* Subtitle */}
          <p className="text-lg text-gray-600 font-light max-w-xl mx-auto leading-relaxed">
            Where Silent Messengers share thoughts and Whisper Listeners provide guidance in a space of understanding
          </p>
          
          {/* CTA Button */}
          <div className="pt-6">
            <Button 
              onClick={onEnter}
              size="lg"
              className="group px-8 py-3 text-base font-medium bg-gray-900 hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Enter the Network
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
          
          {/* Simple feature list */}
          <div className="pt-8">
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-500 font-medium">
              <span>Anonymous</span>
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              <span>Safe</span>
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              <span>Supportive</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
