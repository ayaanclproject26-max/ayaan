import { Star } from "lucide-react";

interface Testimonial {
  id: number;
  name: string;
  role: string;
  content: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Sarah Jenkins",
    role: "Fashion Editor",
    content: "The quality and attention to detail in every piece is simply unmatched. These are staples that I'll wear for years.",
    rating: 5,
  },
  {
    id: 2,
    name: "Michael Chen",
    role: "Verified Buyer",
    content: "Minimalist perfection. The fit is incredible, and the customer service was surprisingly fast and helpful.",
    rating: 5,
  },
  {
    id: 3,
    name: "Emma Roberts",
    role: "Verified Buyer",
    content: "Finally, an ethical brand that doesn't compromise on modern aesthetics. The new collection is absolutely stunning.",
    rating: 5,
  },
  {
    id: 4,
    name: "David Smith",
    role: "Verified Buyer",
    content: "I've replaced half my wardrobe with their essentials. The premium feel justifies every penny.",
    rating: 5,
  },
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-10 sm:py-12 bg-secondary">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center mb-6 md:mb-8">
          <h2 className="text-fluid-h2 font-display uppercase tracking-tight mb-1.5">WHAT OUR CUSTOMERS SAY</h2>
          <p className="text-fluid-body text-muted-foreground">Real experiences from our community</p>
        </div>
        
        {/* Mobile: Swipeable | Desktop: Grid */}
        <div className="w-full overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 min-w-max md:min-w-0 pb-4 md:pb-0">
            {testimonials.map((testimonial) => (
              <div 
                key={testimonial.id} 
                className="flex flex-col w-[80vw] sm:w-[320px] md:w-auto shrink-0 snap-center bg-background p-5 md:p-6 rounded-xl transition-all duration-300 hover:-translate-y-1" 
                style={{ boxShadow: "var(--shadow-soft)" }}
              >
                <div className="flex gap-0.5 text-brass-ink mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} size={14} fill="currentColor" />
                  ))}
                </div>
                <p className="text-sm text-foreground/90 italic flex-grow mb-4 leading-relaxed">&ldquo;{testimonial.content}&rdquo;</p>
                <div className="mt-auto pt-3 border-t border-border/40">
                  <p className="text-sm font-semibold text-foreground">{testimonial.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
