export type ArticleCategory = 'Scams 101' | 'Banking' | 'Links' | 'Jobs & Money' | 'Recovery'
export type RelatedTool = 'message' | 'screenshot' | 'link' | 'call' | 'payment'

export type Block =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'callout'; variant: 'red-flag' | 'what-to-do' | 'tip'; title: string; text: string }

export interface Article {
  slug: string
  title: string
  excerpt: string
  category: ArticleCategory
  readMinutes: number
  publishedAt: string
  pidginSummary: string
  relatedTool: RelatedTool
  body: Block[]
}

export const articles: Article[] = [
  {
    slug: 'how-fake-bank-alerts-work',
    title: 'How Fake Bank Alert Scams Work in Nigeria',
    excerpt: 'Scammers craft screenshots that look exactly like a genuine GTBank or Access Bank credit alert. Here is how to spot the difference before you release goods.',
    category: 'Banking',
    readMinutes: 5,
    publishedAt: '2026-09-10',
    pidginSummary: 'Dem fit fake bank alert make e look real. Before you release anything, enter your bank app yourself go check if money don land. Screenshot no be payment. Verify am inside the official app wey your bank give you.',
    relatedTool: 'payment',
    body: [
      { type: 'paragraph', text: 'Every week, Nigerian traders lose money because they accept a screenshot as proof of payment. Fake bank alert scams are among the most common financial frauds in the country.' },
      { type: 'heading', text: 'What a fake alert actually is' },
      { type: 'paragraph', text: 'A fake alert is a manipulated image designed to imitate a genuine transaction notification from a bank, creating the illusion that money has moved, without any actual transfer.' },
      { type: 'callout', variant: 'red-flag', title: 'Red flag', text: 'If someone shows you a credit alert on their phone instead of letting you verify the transaction in your own banking app, something is wrong.' },
      { type: 'heading', text: 'Three common methods' },
      { type: 'list', items: [
        'Screenshot editing: Apps let anyone change the amount, date, or reference number on a saved bank notification.',
        'SMS spoofing: Services allow fraudsters to send an SMS appearing to come from a real bank sender ID like GTBank.',
        'Third-party alert apps: Some apps generate realistic-looking bank alert interfaces with no real transaction behind them.',
      ]},
      { type: 'callout', variant: 'what-to-do', title: 'What to do', text: 'Open your own bank official app or USSD code and check your account balance directly. A genuine transfer will appear within seconds for most Nigerian banks.' },
      { type: 'callout', variant: 'tip', title: 'Tip', text: 'For USSD: dial your bank code (e.g. *737# for GTBank, *901# for Access) and check your balance before releasing goods or services.' },
      { type: 'paragraph', text: 'If already scammed: call your bank fraud line immediately and file a report with the EFCC at efcc.gov.ng.' },
    ],
  },
  {
    slug: 'otp-scams-explained',
    title: 'Why Scammers Always Ask for Your OTP',
    excerpt: 'A one-time password is the last line of defence between a fraudster and your account. Understanding why they need it helps you never hand it over.',
    category: 'Banking',
    readMinutes: 4,
    publishedAt: '2026-09-14',
    pidginSummary: 'OTP na the last key wey dem need to enter your account. No matter who call you, even if dem say dem be your bank, no give anybody your OTP, PIN, or password. Your bank will NEVER ask. If dem ask you, cut the call immediately.',
    relatedTool: 'call',
    body: [
      { type: 'paragraph', text: 'A one-time password (OTP) is a temporary code your bank sends when you try to authorise a transaction or log in from a new device. It is the final barrier between a fraudster and your money.' },
      { type: 'heading', text: 'Why fraudsters need your OTP' },
      { type: 'paragraph', text: 'When a fraudster has your account number and password, they still cannot complete a transfer without the OTP that arrives on your SIM. Getting you to read it out is their final step.' },
      { type: 'callout', variant: 'red-flag', title: 'Red flag', text: 'I am calling from your bank fraud department. We need your OTP to reverse a suspicious transaction. This is always a script. No bank employee will ever ask for your OTP.' },
      { type: 'heading', text: 'Common pretexts used to get OTPs' },
      { type: 'list', items: [
        'Claiming to be bank staff investigating fraud on your account',
        'Pretending to be tech support fixing a blocked account',
        'Impersonating the Central Bank of Nigeria or EFCC',
        'Saying they need it to verify your identity for a prize or refund',
        'Calling as a mobile network provider needing to reactivate your SIM',
      ]},
      { type: 'callout', variant: 'what-to-do', title: 'What to do', text: 'Hang up immediately. Then call your bank using the number on the back of your debit card. Do not call back the number that called you.' },
      { type: 'paragraph', text: 'If you have already shared an OTP, call your bank emergency fraud line immediately. Banks can sometimes freeze a pending transfer if contacted within minutes.' },
    ],
  },
  {
    slug: 'how-to-spot-phishing-links',
    title: 'How to Spot a Phishing Link Before You Click',
    excerpt: 'Scammers create websites identical to your bank or a popular service. The only giveaway is in the URL if you know what to look for.',
    category: 'Links',
    readMinutes: 5,
    publishedAt: '2026-09-16',
    pidginSummary: 'When you see link for message or WhatsApp, check the domain name carefully. Fake site fit look like gtbank but the address go be something like gtbank-secure.xyz. The real one na gtbank.com. Always check the full address before you type your password.',
    relatedTool: 'link',
    body: [
      { type: 'paragraph', text: 'Phishing links lead to fake websites designed to steal your login credentials, card details, or personal information. They arrive by SMS, WhatsApp, email, and social media.' },
      { type: 'heading', text: 'Anatomy of a suspicious URL' },
      { type: 'paragraph', text: 'Focus on the main domain, the segment immediately before the first single slash or end of the address, to determine if a link is legitimate.' },
      { type: 'list', items: [
        'Legitimate: https://gtbank.com/login where gtbank.com is the domain',
        'Fake: https://gtbank-secure-login.xyz where the full domain is gtbank-secure-login.xyz',
        'Fake: https://gtbankng.net/update which is close but not the real domain',
        'Fake: https://secure.gtbank.support-update.xyz where the real domain is support-update.xyz',
      ]},
      { type: 'callout', variant: 'red-flag', title: 'Red flag', text: 'If the domain has hyphens where the real brand never uses them, ends in .xyz, .online, .top, or has the brand as a subdomain rather than the main domain, it is almost certainly fake.' },
      { type: 'heading', text: 'Other warning signs' },
      { type: 'list', items: [
        'HTTP instead of HTTPS. Legitimate banks always use HTTPS.',
        'Random numbers or characters in the domain',
        'Misspellings: firstbanknigerla instead of firstbanknigeria',
        'Urgent path names: /account-blocked/, /verify-now/, /suspended/',
      ]},
      { type: 'callout', variant: 'what-to-do', title: 'What to do', text: 'Never click a link in an unsolicited SMS or WhatsApp. Open a new browser tab and type the bank address directly, or use the official app. Use SabiSafe Link Guard to inspect any suspicious URL.' },
    ],
  },
  {
    slug: 'advance-fee-fraud-419',
    title: 'Advance-Fee Fraud (419): Why It Still Works in 2026',
    excerpt: 'From inheritance stories to prize notifications, advance-fee scams have evolved but the psychology has not changed. Here is why people fall for them.',
    category: 'Scams 101',
    readMinutes: 6,
    publishedAt: '2026-09-12',
    pidginSummary: 'If anybody promise you big money but say you must pay small money first, na 419. Dem go keep telling you just one more fee forever until you lose everything. No matter how real the story sound, inheritance, lottery, government grant, if they ask you to pay first, run.',
    relatedTool: 'message',
    body: [
      { type: 'paragraph', text: 'Advance-fee fraud, globally known as 419 after the section of the Nigerian Criminal Code it violates, is one of the oldest financial scams in the world. It continues to extract billions annually from victims across every income level.' },
      { type: 'heading', text: 'How the scam is structured' },
      { type: 'paragraph', text: 'The victim is offered a large sum of money on the condition that they first pay a small fee to release or transfer it. Each payment unlocks another obstacle requiring another fee. The promised money never arrives.' },
      { type: 'callout', variant: 'red-flag', title: 'Red flag', text: 'Any message offering you money you did not earn, win, or expect, especially if it requires upfront payment of taxes, legal fees, or processing charges, is almost certainly advance-fee fraud.' },
      { type: 'heading', text: 'Modern variations' },
      { type: 'list', items: [
        'Romance scams: A long-distance relationship leads to a request for money to visit or cover an emergency',
        'Job fraud: A remote job offer requiring you to buy equipment or training upfront',
        'Government grants: Fake CBN or NIRSAL grants requiring a processing fee',
        'Cryptocurrency investment: Doubling schemes requiring an initial deposit',
        'Rental fraud: Paying a deposit on a property the scammer does not own',
      ]},
      { type: 'callout', variant: 'what-to-do', title: 'What to do', text: 'Apply a simple test: would a legitimate organisation need you to pay money to receive money? The answer is always no. Cut contact immediately and report to the EFCC.' },
    ],
  },
  {
    slug: 'job-scams-nigeria',
    title: 'Job Scams Targeting Nigerian Graduates and Job Seekers',
    excerpt: 'Fake remote job offers, form fees, and training payments are stripping job seekers of money they cannot afford to lose. Learn the red flags before you apply.',
    category: 'Jobs & Money',
    readMinutes: 5,
    publishedAt: '2026-09-18',
    pidginSummary: 'Real company no go ask you to pay money before dem employ you. If na online job and dem ask you buy laptop from dem, or pay training fee or registration fee, e na scam. Genuine employer go only collect your time and your work, not your money.',
    relatedTool: 'message',
    body: [
      { type: 'paragraph', text: 'With Nigeria unemployment affecting millions of graduates, fraudsters have found fertile ground in fake job offers. These scams range from simple upfront-fee schemes to elaborate multi-week recruitment processes that end in a financial request.' },
      { type: 'heading', text: 'The most common job scam formats' },
      { type: 'list', items: [
        'Remote data entry or typing jobs requiring a starter kit payment',
        'Customer service roles at international companies requiring a VISA processing fee',
        'Paid internships at government agencies requiring an application fee',
        'Multi-level marketing opportunities disguised as employment',
        'Social media jobs that require you to buy followers or equipment',
      ]},
      { type: 'callout', variant: 'red-flag', title: 'Red flag', text: 'Any employer who asks you to pay money, for any reason, before or during the hiring process is running a scam. Legitimate companies absorb all recruitment costs themselves.' },
      { type: 'paragraph', text: 'Genuine employers interview you, verify your qualifications, and make a job offer without requiring payment. Payment will come to you, not from you.' },
      { type: 'callout', variant: 'tip', title: 'Tip', text: 'Before responding to any job ad, search the company name plus scam or reviews online. Check for a genuine company website with a working contact number and physical address.' },
      { type: 'paragraph', text: 'Stop all communication if you suspect a scam. Report the job ad on the platform where you found it. If you have already paid, report to the EFCC and your bank immediately.' },
    ],
  },
  {
    slug: 'smishing-whatsapp-scams',
    title: 'SMS and WhatsApp Scams: How to Read a Suspicious Message',
    excerpt: 'From account suspended to you have won a prize, suspicious messages follow predictable patterns. Knowing the pattern makes them easy to spot.',
    category: 'Scams 101',
    readMinutes: 4,
    publishedAt: '2026-09-20',
    pidginSummary: 'Scam message always get urgency. Dem wan make you act fast before you think. If message say your account go block, or say you win prize but you must click link, or dem dey ask for your details, no rush. Stop, think, then verify am through official channel.',
    relatedTool: 'message',
    body: [
      { type: 'paragraph', text: 'Smishing (SMS phishing) and WhatsApp scams are the most common entry point for fraud targeting Nigerians. These channels feel personal and immediate, making recipients more likely to act without thinking.' },
      { type: 'heading', text: 'The anatomy of a scam message' },
      { type: 'paragraph', text: 'Almost every scam message includes urgency (your account will be closed in 24 hours), authority (this is the Central Bank of Nigeria), a reward (you have been selected to receive N500,000), or a link to a fake website.' },
      { type: 'callout', variant: 'red-flag', title: 'Red flag', text: 'Phrases like Act now, Your account will be suspended, Verify immediately, You have been selected, or Click this link to claim are designed to bypass your critical thinking.' },
      { type: 'heading', text: 'How to analyse a suspicious message' },
      { type: 'list', items: [
        'Check the sender: Does the number or sender ID match the official contact for the claimed organisation?',
        'Look at the link: Does the destination match the claimed organisation?',
        'Evaluate the request: Would this organisation ever contact you this way?',
        'Search independently: Look up the official website or call their number to verify.',
        'Reverse-search: Copy the message text online. Others may have reported the same scam.',
      ]},
      { type: 'callout', variant: 'what-to-do', title: 'What to do', text: 'Paste the message into SabiSafe Message Guard and review the evidence signals. Then verify any claim through the organisation official channel, not through contact info in the suspicious message.' },
    ],
  },
  {
    slug: 'investment-scams-ponzi',
    title: 'Investment Scams and Ponzi Schemes: Warning Signs',
    excerpt: 'High guaranteed returns with no risk are mathematically impossible. Yet investment scams continue to thrive. Here is how they work and why smart people fall for them.',
    category: 'Jobs & Money',
    readMinutes: 6,
    publishedAt: '2026-09-22',
    pidginSummary: 'Any investment wey promise you say your money go double in short time na likely Ponzi or scam. Real investment get risk, and nobody fit guarantee 50% return per month. When new investor stop coming, everyone go lose.',
    relatedTool: 'message',
    body: [
      { type: 'paragraph', text: 'Nigeria has seen dozens of high-profile investment scheme collapses in the past decade. New schemes continue to attract thousands of victims because they prey on genuine financial pressures and aspirations.' },
      { type: 'heading', text: 'How a Ponzi scheme works' },
      { type: 'paragraph', text: 'A Ponzi scheme pays early investors with money from newer investors rather than genuine returns. As long as new money keeps coming in, it appears to work. When recruitment slows, the scheme collapses and most investors lose everything.' },
      { type: 'callout', variant: 'red-flag', title: 'Red flag', text: 'Guaranteed returns of 20%, 50%, or 100% in weeks or months are impossible in legitimate investing. Any scheme promising these returns is fraudulent or operating as a Ponzi.' },
      { type: 'heading', text: 'Common warning signs' },
      { type: 'list', items: [
        'Returns that are guaranteed or described as risk-free',
        'Pressure to recruit friends and family to earn more',
        'Vague descriptions of how returns are generated',
        'Difficulty withdrawing your money when you want to',
        'Celebrity or influencer endorsements that may be fake or paid',
      ]},
      { type: 'callout', variant: 'what-to-do', title: 'What to do', text: 'Verify any investment firm on the SEC Nigeria portal at sec.gov.ng. Ask for audited financial statements. If the scheme is only promoted through WhatsApp or Telegram with no verifiable address, walk away.' },
    ],
  },
  {
    slug: 'after-the-scam-recovery-steps',
    title: 'What to Do Immediately After Being Scammed in Nigeria',
    excerpt: 'If you have been defrauded, the first few hours are critical. These are the exact steps to take in order to report fraud and maximise your chance of recovery.',
    category: 'Recovery',
    readMinutes: 5,
    publishedAt: '2026-09-24',
    pidginSummary: 'If you don fall for scam, no shame. Call your bank immediately, tell them fraud happen and beg them freeze the transaction. Then report to EFCC. Keep all evidence: screenshots, messages, receipts. Time na the most important thing here.',
    relatedTool: 'payment',
    body: [
      { type: 'paragraph', text: 'Being scammed can happen to anyone. If you suspect you have been defrauded, acting quickly in the first few hours dramatically increases the chances of limiting your loss or recovering funds.' },
      { type: 'heading', text: 'Step 1: Call your bank immediately' },
      { type: 'paragraph', text: 'Most Nigerian banks have 24-hour fraud helplines. If money has been transferred or your card details compromised, call immediately and request a transaction freeze or reversal.' },
      { type: 'callout', variant: 'what-to-do', title: 'What to do', text: 'Look for the fraud hotline on the back of your debit card or the official bank website. Say clearly: I have been a victim of fraud and need to report a suspicious transaction.' },
      { type: 'heading', text: 'Step 2: Preserve all evidence' },
      { type: 'list', items: [
        'Screenshot all messages, emails, and WhatsApp conversations with the scammer',
        'Save any receipts, transaction references, or payment confirmations',
        'Note down phone numbers, email addresses, and usernames involved',
        'Screenshot any profiles or websites before they disappear',
      ]},
      { type: 'heading', text: 'Step 3: Report to the EFCC' },
      { type: 'paragraph', text: 'The EFCC handles cybercrime and financial fraud cases. Report online at efcc.gov.ng, via their mobile app, or in person at any EFCC zonal office. Bring all your preserved evidence.' },
      { type: 'heading', text: 'Step 4: Report to the platform' },
      { type: 'paragraph', text: 'If the scam happened on WhatsApp, Instagram, or Facebook, report the scammer account directly to help prevent others from being scammed.' },
      { type: 'callout', variant: 'tip', title: 'Tip', text: 'Use SabiSafe to generate a documented evidence report. Download or print it as part of your official report package for the EFCC or your bank.' },
      { type: 'heading', text: 'Step 5: Protect your other accounts' },
      { type: 'paragraph', text: 'Change passwords on any accounts that may have been compromised. If you shared an OTP, contact your bank to change your PIN and request a new card.' },
    ],
  },
]

export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug)
}

export function getRelatedArticles(slug: string, count = 2): Article[] {
  const current = articles.find((a) => a.slug === slug)
  if (!current) return articles.slice(0, count)
  const sameCategory = articles.filter((a) => a.slug !== slug && a.category === current.category)
  const others = articles.filter((a) => a.slug !== slug && a.category !== current.category)
  return [...sameCategory, ...others].slice(0, count)
}