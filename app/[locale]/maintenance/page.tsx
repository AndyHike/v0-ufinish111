"use client"
import { Button } from "@/components/ui/button"
import { Wrench, Clock, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function MaintenancePage() {
  return (
    <div className="fixed inset-0 w-screen h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 z-[9999]">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[url('/api/placeholder/1920/1080')] bg-cover bg-center opacity-10" />

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000" />
      </div>

      {/* Admin login button */}
      <div className="absolute top-6 right-6 z-10">
        <Link href="/auth/signin">
          <Button
            variant="outline"
            size="sm"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
          >
            Вхід для адміністраторів
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <div className="text-center max-w-2xl mx-auto">
          {/* Icon */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center animate-pulse">
                <Wrench className="w-12 h-12 text-white" />
              </div>
              <div className="absolute inset-0 w-24 h-24 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-ping opacity-20" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 animate-fade-in">Технічні роботи</h1>

          {/* Description */}
          <p className="text-xl md:text-2xl text-slate-300 mb-8 leading-relaxed animate-fade-in animation-delay-500">
            Ми працюємо над покращенням нашого сервісу.
            <br />
            Незабаром все буде готово!
          </p>

          {/* ETA */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/20 animate-fade-in animation-delay-1000">
            <div className="flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-purple-400 mr-3" />
              <span className="text-lg font-semibold text-white">Очікуваний час завершення</span>
            </div>
            <div className="text-2xl font-bold text-purple-300">Сьогодні, 23:00</div>
          </div>

          {/* Contact info */}
          <div className="text-slate-400 animate-fade-in animation-delay-1500">
            <p className="mb-2">З питаннями звертайтесь:</p>
            <p className="font-semibold text-white">📧 support@devicehelp.cz</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }
        
        .animation-delay-500 {
          animation-delay: 0.5s;
          opacity: 0;
        }
        
        .animation-delay-1000 {
          animation-delay: 1s;
          opacity: 0;
        }
        
        .animation-delay-1500 {
          animation-delay: 1.5s;
          opacity: 0;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  )
}
