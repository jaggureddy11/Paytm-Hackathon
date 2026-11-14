import sys
from pathlib import Path
import pptx
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

def create_deck(output_path="Paytm_Saathi_Pitch_Deck.pptx"):
    prs = pptx.Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Color Palette (Paytm Brand & Minimalist FinTech)
    COLOR_NAVY = RGBColor(0, 41, 112)       # #002970 Paytm Primary
    COLOR_CYAN = RGBColor(0, 186, 242)     # #00BAF2 Paytm Cyan
    COLOR_DARK = RGBColor(15, 23, 42)       # #0F172A Slate 900
    COLOR_MUTED = RGBColor(100, 116, 139)   # #64748B Slate 500
    COLOR_LIGHT_BG = RGBColor(248, 250, 252) # #F8FAFC Slate 50
    COLOR_WHITE = RGBColor(255, 255, 255)
    COLOR_BORDER = RGBColor(226, 232, 240)  # #E2E8F0
    COLOR_CARD_BG = RGBColor(255, 255, 255)
    COLOR_SKY_BG = RGBColor(235, 248, 254)  # #EBF8FE
    COLOR_EMERALD = RGBColor(16, 185, 129)

    FONT_HEADING = "Trebuchet MS"
    FONT_BODY = "Arial"

    def add_header(slide, tag_text, title_text, subtitle_text=None, is_dark=False):
        # Tag
        tb_tag = slide.shapes.add_textbox(Inches(0.8), Inches(0.55), Inches(11.7), Inches(0.35))
        tf_tag = tb_tag.text_frame
        tf_tag.word_wrap = True
        tf_tag.margin_left = tf_tag.margin_right = tf_tag.margin_top = tf_tag.margin_bottom = 0
        p_tag = tf_tag.paragraphs[0]
        p_tag.text = tag_text.upper()
        p_tag.font.name = FONT_HEADING
        p_tag.font.size = Pt(11)
        p_tag.font.bold = True
        p_tag.font.color.rgb = COLOR_CYAN

        # Title
        tb_title = slide.shapes.add_textbox(Inches(0.8), Inches(0.9), Inches(11.7), Inches(0.65))
        tf_title = tb_title.text_frame
        tf_title.word_wrap = True
        tf_title.margin_left = tf_title.margin_right = tf_title.margin_top = tf_title.margin_bottom = 0
        p_title = tf_title.paragraphs[0]
        p_title.text = title_text
        p_title.font.name = FONT_HEADING
        p_title.font.size = Pt(26)
        p_title.font.bold = True
        p_title.font.color.rgb = COLOR_WHITE if is_dark else COLOR_NAVY

        # Subtitle
        if subtitle_text:
            tb_sub = slide.shapes.add_textbox(Inches(0.8), Inches(1.55), Inches(11.7), Inches(0.45))
            tf_sub = tb_sub.text_frame
            tf_sub.word_wrap = True
            tf_sub.margin_left = tf_sub.margin_right = tf_sub.margin_top = tf_sub.margin_bottom = 0
            p_sub = tf_sub.paragraphs[0]
            p_sub.text = subtitle_text
            p_sub.font.name = FONT_BODY
            p_sub.font.size = Pt(13)
            p_sub.font.color.rgb = RGBColor(203, 213, 225) if is_dark else COLOR_MUTED

    # =========================================================================
    # SLIDE 1: HERO / TITLE SLIDE (Dark Navy Minimalist)
    # =========================================================================
    slide1 = prs.slides.add_slide(blank_layout)
    bg1 = slide1.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    bg1.fill.solid()
    bg1.fill.fore_color.rgb = COLOR_NAVY
    bg1.line.color.rgb = COLOR_NAVY

    # Cyan top accent strip
    top_strip = slide1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(0.8), Inches(1.5), Inches(0.06))
    top_strip.fill.solid()
    top_strip.fill.fore_color.rgb = COLOR_CYAN
    top_strip.line.fill.background()

    # Category Pill
    tag_box = slide1.shapes.add_textbox(Inches(0.8), Inches(1.1), Inches(10), Inches(0.4))
    tf1 = tag_box.text_frame
    p = tf1.paragraphs[0]
    p.text = "PAYTM HACKATHON 2026 • FINTECH & MULTILINGUAL VOICE AI"
    p.font.name = FONT_HEADING
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = COLOR_CYAN

    # Title
    title_box = slide1.shapes.add_textbox(Inches(0.8), Inches(1.6), Inches(11), Inches(1.2))
    tf_t = title_box.text_frame
    p_t = tf_t.paragraphs[0]
    p_t.text = "Paytm Saathi"
    p_t.font.name = FONT_HEADING
    p_t.font.size = Pt(54)
    p_t.font.bold = True
    p_t.font.color.rgb = COLOR_WHITE

    # Subtitle
    sub_box = slide1.shapes.add_textbox(Inches(0.8), Inches(2.9), Inches(10.5), Inches(1.0))
    tf_s = sub_box.text_frame
    tf_s.word_wrap = True
    p_s = tf_s.paragraphs[0]
    p_s.text = "Multilingual Voice AI Co-Pilot for Merchant Closing & Financial Ledgers"
    p_s.font.name = FONT_BODY
    p_s.font.size = Pt(22)
    p_s.font.color.rgb = RGBColor(224, 242, 254)

    # 3 Key Value Pills Container
    pills = [
        ("Soundbox Integrated", "Reconciles live QR sales without re-entry"),
        ("30-Second Voice Closing", "Cash, expenses, and inventory via natural speech"),
        ("Multilingual First", "Telugu, Hindi, and English native models")
    ]
    pill_w = Inches(3.64)
    pill_gap = Inches(0.4)
    left_start = Inches(0.8)
    top_pos = Inches(4.3)

    for i, (p_title, p_desc) in enumerate(pills):
        p_left = left_start + i * (pill_w + pill_gap)
        card = slide1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, p_left, top_pos, pill_w, Inches(1.5))
        card.fill.solid()
        card.fill.fore_color.rgb = RGBColor(10, 52, 128)
        card.line.color.rgb = RGBColor(30, 75, 160)

        tf = card.text_frame
        tf.margin_left = tf.margin_right = Inches(0.25)
        tf.margin_top = Inches(0.2)
        tf.word_wrap = True
        
        p1 = tf.paragraphs[0]
        p1.text = p_title
        p1.font.name = FONT_HEADING
        p1.font.size = Pt(14)
        p1.font.bold = True
        p1.font.color.rgb = COLOR_CYAN

        p2 = tf.add_paragraph()
        p2.text = p_desc
        p2.font.name = FONT_BODY
        p2.font.size = Pt(11.5)
        p2.font.color.rgb = RGBColor(226, 232, 240)
        p2.space_before = Pt(6)

    # Footer
    ft_box = slide1.shapes.add_textbox(Inches(0.8), Inches(6.4), Inches(11.7), Inches(0.4))
    tf_f = ft_box.text_frame
    p_f = tf_f.paragraphs[0]
    p_f.text = "Your Business. Your Language. Your AI Partner."
    p_f.font.name = FONT_BODY
    p_f.font.size = Pt(12)
    p_f.font.color.rgb = RGBColor(148, 163, 184)

    # =========================================================================
    # SLIDE 2: THE PROBLEM (The 9:00 PM Kirana Reality)
    # =========================================================================
    slide2 = prs.slides.add_slide(blank_layout)
    add_header(
        slide2,
        "Market Reality & Problem",
        "The 9:00 PM Kirana Dilemma",
        "India has 30M+ small retail merchants. At store closing, digital payments abruptly stop."
    )

    cards_p2 = [
        (
            "Disconnected Cash & Digital",
            "Soundbox tracks digital QR collections seamlessly, but 40% to 60% of Kirana retail volume remains unrecorded paper cash.",
            "Result: Fragmented ledger with no unified view of true daily earnings."
        ),
        (
            "End-of-Day Exhaustion",
            "After a 14-hour workday, merchants spend 45+ minutes manually deciphering handwritten khata notes, slips, and vendor chits.",
            "Result: High error rates, lost expense records, and cash leakage."
        ),
        (
            "Interface & Language Barrier",
            "Standard accounting software demands tedious manual typing, complex navigation trees, and rigid English terminology.",
            "Result: 85%+ of micro-merchants abandon traditional bookkeeping apps."
        )
    ]

    card_w = Inches(3.64)
    gap = Inches(0.4)
    for i, (c_title, c_body, c_res) in enumerate(cards_p2):
        c_left = Inches(0.8) + i * (card_w + gap)
        box = slide2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, c_left, Inches(2.2), card_w, Inches(4.5))
        box.fill.solid()
        box.fill.fore_color.rgb = COLOR_LIGHT_BG
        box.line.color.rgb = COLOR_BORDER

        # Number pill inside card
        num_box = slide2.shapes.add_shape(MSO_SHAPE.RECTANGLE, c_left + Inches(0.25), Inches(2.45), Inches(0.6), Inches(0.3))
        num_box.fill.solid()
        num_box.fill.fore_color.rgb = COLOR_NAVY
        num_box.line.fill.background()
        ntf = num_box.text_frame
        np = ntf.paragraphs[0]
        np.text = f"0{i+1}"
        np.font.name = FONT_HEADING
        np.font.size = Pt(11)
        np.font.bold = True
        np.font.color.rgb = COLOR_WHITE
        np.alignment = PP_ALIGN.CENTER

        tf = slide2.shapes.add_textbox(c_left + Inches(0.25), Inches(2.9), card_w - Inches(0.5), Inches(3.6)).text_frame
        tf.word_wrap = True

        p1 = tf.paragraphs[0]
        p1.text = c_title
        p1.font.name = FONT_HEADING
        p1.font.size = Pt(16)
        p1.font.bold = True
        p1.font.color.rgb = COLOR_NAVY

        p2 = tf.add_paragraph()
        p2.text = c_body
        p2.font.name = FONT_BODY
        p2.font.size = Pt(12)
        p2.font.color.rgb = COLOR_DARK
        p2.space_before = Pt(12)

        p3 = tf.add_paragraph()
        p3.text = c_res
        p3.font.name = FONT_BODY
        p3.font.size = Pt(11.5)
        p3.font.bold = True
        p3.font.color.rgb = RGBColor(180, 83, 9) # Amber text
        p3.space_before = Pt(14)

    # =========================================================================
    # SLIDE 3: THE SOLUTION (Paytm Saathi)
    # =========================================================================
    slide3 = prs.slides.add_slide(blank_layout)
    add_header(
        slide3,
        "Product Innovation",
        "Paytm Saathi: 30-Second Voice Closing",
        "A conversational AI co-pilot built directly into Paytm's ecosystem, speaking native Indian languages."
    )

    cards_s3 = [
        (
            "Soundbox Pre-Reconciliation",
            "Starts with live data",
            "Pulls today's Soundbox QR collections directly from Paytm DB. Saathi greets the merchant with their verified digital total—never asks for numbers Paytm already knows.",
            COLOR_SKY_BG,
            COLOR_NAVY
        ),
        (
            "Conversational Closing Flow",
            "3 natural voice turns",
            "1. Cash collected today?\n2. Business expenses (electricity, tea, transport)?\n3. Stock or inventory purchases?\nHandles colloquial speech in Telugu, Hindi, & English.",
            COLOR_LIGHT_BG,
            COLOR_NAVY
        ),
        (
            "Instant Ledger & Stock Reconciliation",
            "Zero typing required",
            "Automatically calculates Gross Sales (QR + Cash), Net In-Hand, and updates remaining product inventory in SQLite. Commits to records with a single spoken confirmation.",
            COLOR_LIGHT_BG,
            COLOR_NAVY
        )
    ]

    for i, (c_title, c_sub, c_body, bg_color, border_color) in enumerate(cards_s3):
        c_left = Inches(0.8) + i * (card_w + gap)
        box = slide3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, c_left, Inches(2.2), card_w, Inches(4.5))
        box.fill.solid()
        box.fill.fore_color.rgb = bg_color
        box.line.color.rgb = COLOR_BORDER

        tf = box.text_frame
        tf.margin_left = tf.margin_right = Inches(0.25)
        tf.margin_top = Inches(0.3)
        tf.word_wrap = True

        p1 = tf.paragraphs[0]
        p1.text = c_title
        p1.font.name = FONT_HEADING
        p1.font.size = Pt(16)
        p1.font.bold = True
        p1.font.color.rgb = COLOR_NAVY

        p2 = tf.add_paragraph()
        p2.text = c_sub.upper()
        p2.font.name = FONT_HEADING
        p2.font.size = Pt(10)
        p2.font.bold = True
        p2.font.color.rgb = COLOR_CYAN
        p2.space_before = Pt(4)

        p3 = tf.add_paragraph()
        p3.text = c_body
        p3.font.name = FONT_BODY
        p3.font.size = Pt(12)
        p3.font.color.rgb = COLOR_DARK
        p3.space_before = Pt(14)

    # =========================================================================
    # SLIDE 4: ARCHITECTURE & VOICE ENGINE
    # =========================================================================
    slide4 = prs.slides.add_slide(blank_layout)
    add_header(
        slide4,
        "System Architecture",
        "Voice AI Pipeline & Infrastructure",
        "Full-stack architecture optimized for low-latency regional speech recognition and high availability."
    )

    steps_s4 = [
        (
            "Speech Recognition",
            "Sarvam Saaras v4 STT",
            "Captures colloquial Indian speech with dialect resilience. Supports mixed code-switching (Hinglish/Tenglish)."
        ),
        (
            "Intent & Entity Engine",
            "Rule-Fuzzy Hybrid",
            "State machine extracting amounts, expense categories, item names, and confirmation signals without hallucinations."
        ),
        (
            "Voice Synthesis",
            "Sarvam Bulbul v4 Flash",
            "Generates expressive, natural regional audio responses in Telugu, Hindi, and Indian English in real time."
        ),
        (
            "Storage & Ledger",
            "FastAPI + SQLite Engine",
            "Atomic transaction commits, inventory balance calculation, and audit trails persisted across sessions."
        )
    ]

    card_w4 = Inches(2.68)
    gap4 = Inches(0.33)
    for i, (t1, t2, desc) in enumerate(steps_s4):
        c_left = Inches(0.8) + i * (card_w4 + gap4)
        box = slide4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, c_left, Inches(2.2), card_w4, Inches(3.3))
        box.fill.solid()
        box.fill.fore_color.rgb = COLOR_LIGHT_BG
        box.line.color.rgb = COLOR_BORDER

        tf = box.text_frame
        tf.margin_left = tf.margin_right = Inches(0.2)
        tf.margin_top = Inches(0.25)
        tf.word_wrap = True

        p1 = tf.paragraphs[0]
        p1.text = f"LAYER 0{i+1}"
        p1.font.name = FONT_HEADING
        p1.font.size = Pt(10)
        p1.font.bold = True
        p1.font.color.rgb = COLOR_CYAN

        p2 = tf.add_paragraph()
        p2.text = t1
        p2.font.name = FONT_HEADING
        p2.font.size = Pt(15)
        p2.font.bold = True
        p2.font.color.rgb = COLOR_NAVY
        p2.space_before = Pt(4)

        p3 = tf.add_paragraph()
        p3.text = t2
        p3.font.name = FONT_BODY
        p3.font.size = Pt(11)
        p3.font.bold = True
        p3.font.color.rgb = RGBColor(16, 185, 129)
        p3.space_before = Pt(4)

        p4 = tf.add_paragraph()
        p4.text = desc
        p4.font.name = FONT_BODY
        p4.font.size = Pt(11)
        p4.font.color.rgb = COLOR_DARK
        p4.space_before = Pt(10)

    # Bottom Callout: Resilient Zero-Permission Guarantee
    callout = slide4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(5.8), Inches(11.73), Inches(0.95))
    callout.fill.solid()
    callout.fill.fore_color.rgb = COLOR_SKY_BG
    callout.line.color.rgb = RGBColor(186, 230, 253)

    ctf = callout.text_frame
    ctf.margin_left = Inches(0.3)
    ctf.margin_top = Inches(0.15)
    ctf.word_wrap = True
    cp1 = ctf.paragraphs[0]
    cp1.text = "RESILIENT BROWSER ARCHITECTURE: ZERO-PERMISSION MODE"
    cp1.font.name = FONT_HEADING
    cp1.font.size = Pt(11)
    cp1.font.bold = True
    cp1.font.color.rgb = COLOR_NAVY

    cp2 = ctf.add_paragraph()
    cp2.text = "If hardware microphone access is withheld or blocked by mobile webviews, the UI auto-transitions into zero-friction interactive mode with one-tap contextual voice responses. The demo never breaks or displays dead-end permission errors."
    cp2.font.name = FONT_BODY
    cp2.font.size = Pt(10.5)
    cp2.font.color.rgb = COLOR_DARK
    cp2.space_before = Pt(3)

    # =========================================================================
    # SLIDE 5: USER JOURNEY & VOICE EXPERIENCE
    # =========================================================================
    slide5 = prs.slides.add_slide(blank_layout)
    add_header(
        slide5,
        "User Journey",
        "A Complete Closing Session in 4 Turns",
        "Designed to respect the cognitive load of tired store owners at the end of the day."
    )

    steps_s5 = [
        (
            "1. Greet & State QR",
            "Saathi speaks:",
            '"Hi, how are you doing today? Today\'s Paytm QR collection is ₹1,000. How much cash did you collect today?"',
            COLOR_SKY_BG
        ),
        (
            "2. Collect Cash",
            "Merchant answers:",
            '"I collected 2500 rupees cash today."\nSaathi captures ₹2,500 and smoothly prompts for daily business expenses.',
            COLOR_LIGHT_BG
        ),
        (
            "3. Capture Expenses",
            "Merchant answers:",
            '"500 rupees for electricity bill."\nSaathi logs the expense and asks if any new inventory or stock was purchased today.',
            COLOR_LIGHT_BG
        ),
        (
            "4. Stock & Confirm",
            "Summary Card appears:",
            'Total Sales: ₹3,500 | Expenses: ₹500 | Stock: 20 Milk Packets.\nMerchant taps "Confirm & Save" or says "Confirm". Reconciled instantly.',
            RGBColor(232, 248, 240) # Emerald tint
        )
    ]

    for i, (title, speaker, content, bg_c) in enumerate(steps_s5):
        c_left = Inches(0.8) + i * (card_w4 + gap4)
        box = slide5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, c_left, Inches(2.2), card_w4, Inches(4.5))
        box.fill.solid()
        box.fill.fore_color.rgb = bg_c
        box.line.color.rgb = COLOR_BORDER

        tf = box.text_frame
        tf.margin_left = tf.margin_right = Inches(0.2)
        tf.margin_top = Inches(0.25)
        tf.word_wrap = True

        p1 = tf.paragraphs[0]
        p1.text = title
        p1.font.name = FONT_HEADING
        p1.font.size = Pt(14)
        p1.font.bold = True
        p1.font.color.rgb = COLOR_NAVY

        p2 = tf.add_paragraph()
        p2.text = speaker.upper()
        p2.font.name = FONT_HEADING
        p2.font.size = Pt(10)
        p2.font.bold = True
        p2.font.color.rgb = COLOR_CYAN
        p2.space_before = Pt(8)

        p3 = tf.add_paragraph()
        p3.text = content
        p3.font.name = FONT_BODY
        p3.font.size = Pt(11)
        p3.font.color.rgb = COLOR_DARK
        p3.space_before = Pt(8)

    # =========================================================================
    # SLIDE 6: BUSINESS VALUE FOR PAYTM
    # =========================================================================
    slide6 = prs.slides.add_slide(blank_layout)
    add_header(
        slide6,
        "Strategic Value",
        "Why Paytm Wins with Paytm Saathi",
        "Deepening merchant retention, expanding credit underwriting, and monetizing kirana micro-SaaS."
    )

    biz_cards = [
        (
            "Soundbox Defense & Stickiness",
            "Transforms passive audio speakers into an intelligent AI operating system",
            "Paytm Soundbox pioneered audio payment alerts. Competitors (PhonePe, BharatPe, Google Pay) offer identical speaker hardware. Paytm Saathi transforms the Soundbox from a simple speaker into an indispensable merchant business partner, eliminating churn."
        ),
        (
            "Proprietary Lending Data",
            "Captures the invisible cash economy for merchant loans underwriting",
            "Paytm's high-margin merchant loan distribution is capped by visible digital transaction volumes. By recording cash collections, true expense ratios, and stock investments, Paytm acquires rich, proprietary underwriting signals to safely expand credit lines."
        ),
        (
            "Kirana Micro-SaaS Monetization",
            "Scalable subscription revenue model across 30 Million stores",
            "Saathi Core is bundled with Soundbox subscription (driving adoption). Saathi Pro (₹99-199/month) offers multi-store analytics, automated distributor reordering, tax reports, and voice supplier payments directly through Paytm UPI."
        )
    ]

    for i, (b_title, b_sub, b_body) in enumerate(biz_cards):
        c_left = Inches(0.8) + i * (card_w + gap)
        box = slide6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, c_left, Inches(2.2), card_w, Inches(4.5))
        box.fill.solid()
        box.fill.fore_color.rgb = COLOR_LIGHT_BG
        box.line.color.rgb = COLOR_BORDER

        tf = box.text_frame
        tf.margin_left = tf.margin_right = Inches(0.25)
        tf.margin_top = Inches(0.3)
        tf.word_wrap = True

        p1 = tf.paragraphs[0]
        p1.text = b_title
        p1.font.name = FONT_HEADING
        p1.font.size = Pt(16)
        p1.font.bold = True
        p1.font.color.rgb = COLOR_NAVY

        p2 = tf.add_paragraph()
        p2.text = b_sub
        p2.font.name = FONT_BODY
        p2.font.size = Pt(11)
        p2.font.bold = True
        p2.font.color.rgb = COLOR_CYAN
        p2.space_before = Pt(6)

        p3 = tf.add_paragraph()
        p3.text = b_body
        p3.font.name = FONT_BODY
        p3.font.size = Pt(11.5)
        p3.font.color.rgb = COLOR_DARK
        p3.space_before = Pt(12)

    # =========================================================================
    # SLIDE 7: HACKATHON SUMMARY & LIVE MVP
    # =========================================================================
    slide7 = prs.slides.add_slide(blank_layout)
    bg7 = slide7.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    bg7.fill.solid()
    bg7.fill.fore_color.rgb = COLOR_NAVY
    bg7.line.color.rgb = COLOR_NAVY

    add_header(
        slide7,
        "Hackathon Delivery",
        "Production-Ready Prototype",
        "Fully implemented, verified end-to-end, and deployed on cloud infrastructure.",
        is_dark=True
    )

    metrics = [
        ("Vercel Live", "Production Cloud Deployment", "paytm-saathi-fawn.vercel.app with serverless Python & SQLite integration"),
        ("3 Languages", "Multilingual Indian Speech", "English, Telugu, & Hindi with instant runtime language switching"),
        ("Zero Friction", "No Permissions Required", "Works across any mobile browser, in-app webview, or desktop prototype"),
        ("Clean Aesthetic", "Senior Paytm Design Language", "Neo-minimalist fintech styling, zero emojis, high-contrast typography")
    ]

    card_w7 = Inches(2.68)
    gap7 = Inches(0.33)
    for i, (m_val, m_lbl, m_sub) in enumerate(metrics):
        c_left = Inches(0.8) + i * (card_w7 + gap7)
        box = slide7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, c_left, Inches(2.3), card_w7, Inches(3.4))
        box.fill.solid()
        box.fill.fore_color.rgb = RGBColor(10, 52, 128)
        box.line.color.rgb = RGBColor(30, 75, 160)

        tf = box.text_frame
        tf.margin_left = tf.margin_right = Inches(0.2)
        tf.margin_top = Inches(0.3)
        tf.word_wrap = True

        p1 = tf.paragraphs[0]
        p1.text = m_val
        p1.font.name = FONT_HEADING
        p1.font.size = Pt(22)
        p1.font.bold = True
        p1.font.color.rgb = COLOR_CYAN

        p2 = tf.add_paragraph()
        p2.text = m_lbl
        p2.font.name = FONT_HEADING
        p2.font.size = Pt(13)
        p2.font.bold = True
        p2.font.color.rgb = COLOR_WHITE
        p2.space_before = Pt(8)

        p3 = tf.add_paragraph()
        p3.text = m_sub
        p3.font.name = FONT_BODY
        p3.font.size = Pt(11)
        p3.font.color.rgb = RGBColor(203, 213, 225)
        p3.space_before = Pt(8)

    # Bottom Mission Bar
    m_box = slide7.shapes.add_textbox(Inches(0.8), Inches(6.15), Inches(11.73), Inches(0.6))
    mtf = m_box.text_frame
    mp = mtf.paragraphs[0]
    mp.text = "Paytm Saathi: Turning 30 Million Soundboxes into Active AI Partners."
    mp.font.name = FONT_HEADING
    mp.font.size = Pt(15)
    mp.font.bold = True
    mp.font.color.rgb = COLOR_WHITE
    mp.alignment = PP_ALIGN.CENTER

    prs.save(output_path)
    print(f"Presentation successfully created at: {output_path}")

if __name__ == "__main__":
    out = "Paytm_Saathi_Pitch_Deck.pptx"
    if len(sys.argv) > 1:
        out = sys.argv[1]
    create_deck(out)
