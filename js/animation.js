// animation.js
import { gsap } from "https://cdn.skypack.dev/gsap";
import { ScrollTrigger } from "https://cdn.skypack.dev/gsap/ScrollTrigger";
import { TextPlugin } from "https://cdn.skypack.dev/gsap/TextPlugin";

gsap.registerPlugin(ScrollTrigger, TextPlugin);

ScrollTrigger.matchMedia({

    // Large Screen Animation (Shrink)
    "(min-width: 1280px)": function() {
        // Find ALL sections with the .cta-section class
        gsap.utils.toArray(".cta-section").forEach(section => {
            const button = section.querySelector(".cta-button");
            const container = section.querySelector(".cta-container");
            const wrapper = section.querySelector(".cta-pin-wrapper");

            gsap.set(button, { autoAlpha: 0 });

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: section,
                    pin: wrapper,
                    pinSpacing: true, scrub: 1,
                    start: "top 70%", end: "+=1000",
                }
            });

            tl.fromTo(container,
                { maxWidth: "100vw", borderRadius: "0px" },
                { maxWidth: "1100px", borderRadius: "2rem", ease: "power1.inOut" }
            ).to(button,
                { autoAlpha: 1, ease: "power1.in" },
                "<50%"
            );
        });
    },

    // Medium Screen Animation (Expand)
    "(min-width: 1024px) and (max-width: 1279px)": function() {
        // Find ALL sections with the .cta-section class
        gsap.utils.toArray(".cta-section").forEach(section => {
            const container = section.querySelector(".cta-container");
            const wrapper = section.querySelector(".cta-pin-wrapper");

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: section,
                    pin: wrapper,
                    pinSpacing: true, scrub: 1,
                    start: "top 70%", end: "+=500",
                }
            });

            tl.fromTo(container,
                { maxWidth: "900px", borderRadius: "2rem" },
                { maxWidth: "100vw", borderRadius: "0px", ease: "power1.inOut" }
            );
        });
    },
    // "How It Works" Animation (Desktop Only)
      "(min-width: 1024px)": function() {
        
        const hiwTimeline = gsap.timeline({
            scrollTrigger: {
                trigger: "#how-it-works",
                start: "top 60%",
            }
        });

        // Animation Sequence
        hiwTimeline
            .to(".bias-card", {
                autoAlpha: 1, y: -20, duration: 0.5,
                stagger: 0.15, ease: "power2.out",
            })
            .to("#hiw-arrow", { autoAlpha: 1, duration: 0.4 }, "-=0.2")
            .to("#hiw-score-circle", {
                autoAlpha: 1,
                strokeDashoffset: 113, // Animates to a score of 60
                duration: 1,
                ease: "power2.inOut",
            })
            .to("#hiw-score-number", { autoAlpha: 1 }, "<")
            .fromTo("#hiw-score-number", 
                { textContent: 0 },
                { textContent: 60, duration: 1, ease: "power2.inOut", snap: { textContent: 1 } },
                "<"
            );
    },
    
    
});

