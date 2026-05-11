import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

// Tier 20 — generic transactional email template. Every notify() call
// renders into this template; the trigger-specific content (title, body,
// linkUrl, linkLabel) comes from the caller. Keeps us shipping one
// template instead of 11 per-event templates while still looking like a
// real product email.

interface NotificationEmailProps {
  recipientName?: string;
  title: string;
  body: string;
  linkUrl?: string | null;
  linkLabel?: string;
  preview?: string;
}

export function NotificationEmail({
  recipientName,
  title,
  body,
  linkUrl,
  linkLabel = "Open DriveXP",
  preview,
}: NotificationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview ?? title}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.brandSection}>
            <Heading as="h1" style={styles.brand}>
              DriveXP
            </Heading>
            <Text style={styles.tagline}>Peer-to-peer car marketplace</Text>
          </Section>

          <Hr style={styles.hr} />

          <Section style={styles.bodySection}>
            <Heading as="h2" style={styles.title}>
              {title}
            </Heading>
            {recipientName ? (
              <Text style={styles.greeting}>Hi {recipientName.split(" ")[0]},</Text>
            ) : null}
            <Text style={styles.bodyText}>{body}</Text>
            {linkUrl ? (
              <Section style={styles.buttonContainer}>
                <Button href={linkUrl} style={styles.button}>
                  {linkLabel}
                </Button>
              </Section>
            ) : null}
          </Section>

          <Hr style={styles.hr} />

          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              You received this email because you have an account on
              DriveXP. Manage your account at{" "}
              <a href="https://drivexp-eta.vercel.app" style={styles.footerLink}>
                drivexp-eta.vercel.app
              </a>
              .
            </Text>
            <Text style={styles.footerText}>
              © 2026 DriveXP Marketplace.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const styles = {
  body: {
    backgroundColor: "#faf8ff",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  container: {
    backgroundColor: "#ffffff",
    margin: "40px auto",
    padding: "32px",
    maxWidth: "560px",
    borderRadius: "16px",
    boxShadow: "0 8px 32px rgba(19, 27, 46, 0.06)",
  },
  brandSection: {
    paddingBottom: "8px",
  },
  brand: {
    fontSize: "24px",
    fontWeight: 800,
    color: "#0052cc",
    margin: 0,
    letterSpacing: "-0.02em",
  },
  tagline: {
    fontSize: "11px",
    fontWeight: 700,
    color: "#6c7693",
    margin: "4px 0 0 0",
    textTransform: "uppercase" as const,
    letterSpacing: "0.24em",
  },
  hr: {
    borderColor: "#e4e7f1",
    margin: "24px 0",
  },
  bodySection: {
    padding: "0",
  },
  title: {
    fontSize: "22px",
    fontWeight: 800,
    color: "#131b2e",
    margin: "0 0 16px 0",
    lineHeight: "1.3",
  },
  greeting: {
    fontSize: "15px",
    color: "#131b2e",
    margin: "0 0 12px 0",
  },
  bodyText: {
    fontSize: "15px",
    lineHeight: "1.6",
    color: "#3f4865",
    margin: "0 0 24px 0",
  },
  buttonContainer: {
    textAlign: "left" as const,
    margin: "16px 0 8px 0",
  },
  button: {
    backgroundColor: "#0052cc",
    color: "#ffffff",
    padding: "12px 24px",
    borderRadius: "999px",
    fontSize: "14px",
    fontWeight: 700,
    textDecoration: "none",
    display: "inline-block",
  },
  footer: {
    padding: "0",
  },
  footerText: {
    fontSize: "12px",
    color: "#6c7693",
    margin: "4px 0",
    lineHeight: "1.5",
  },
  footerLink: {
    color: "#0052cc",
    textDecoration: "underline",
  },
};
