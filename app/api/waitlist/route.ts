import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Get admin emails from environment variable
const NEXT_PUBLIC_ADMIN_EMAILS = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').filter(Boolean) || [];

// Types for Supabase webhook payload
interface UserRecord {
  id: string;
  email: string;
  created_at: string;
  phone: string | null;
  role: string;
  is_anonymous: boolean;
  raw_app_meta_data: {
    provider: string;
    providers: string[];
  };
}

interface WebhookPayload {
  type: string;
  table: string;
  schema: string;
  record: UserRecord;
  old_record: null;
}

// Validate email format
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export async function POST(request: NextRequest) {
  try {
    console.log('📥 Received webhook request');
    
    const payload = await request.json() as WebhookPayload;
    console.log('📦 Webhook payload:', JSON.stringify(payload, null, 2));

    // Validate webhook type
    if (payload.type !== 'INSERT') {
      console.log('❌ Invalid webhook type:', payload.type);
      return NextResponse.json(
        { error: 'Only INSERT webhooks are processed' },
        { status: 400 }
      );
    }

    // Validate payload structure
    if (!payload.record || !payload.record.email || !payload.record.created_at) {
      console.log('❌ Invalid payload structure:', payload);
      return NextResponse.json(
        { error: 'Invalid payload: missing required fields' },
        { status: 400 }
      );
    }

    const record = payload.record;

    // Validate email format
    if (!isValidEmail(record.email)) {
      console.log('❌ Invalid email format:', record.email);
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Format signup date
    const signupDate = new Date(record.created_at).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });

    // Validate admin emails configuration
    if (NEXT_PUBLIC_ADMIN_EMAILS.length === 0) {
      console.log('❌ No admin emails configured');
      return NextResponse.json(
        { error: 'No admin emails configured' },
        { status: 500 }
      );
    }

    console.log('📧 Sending notification to:', NEXT_PUBLIC_ADMIN_EMAILS);

    // Send email notification
    await resend.emails.send({
      from: 'AI Film Studio <crew@aifilmstudio.com>',
      to: NEXT_PUBLIC_ADMIN_EMAILS,
      subject: '🎬 New User Joined AI Film Studio',
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; border-radius: 10px; padding: 20px; margin-bottom: 20px;">
              <h1 style="color: #1a1a1a; margin-top: 0; text-align: center;">🎬 AI Film Studio</h1>
              <h2 style="color: #2d3748; margin-bottom: 20px; text-align: center;">New User Registration Alert</h2>
            </div>

            <div style="background-color: white; border-radius: 10px; padding: 20px; border: 1px solid #e2e8f0;">
              <h3 style="color: #2d3748; margin-top: 0;">User Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #4a5568; width: 140px;">
                    <strong>Email:</strong>
                  </td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #2d3748;">
                    ${record.email}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #4a5568;">
                    <strong>User ID:</strong>
                  </td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #2d3748;">
                    ${record.id}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #4a5568;">
                    <strong>Auth Provider:</strong>
                  </td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #2d3748;">
                    ${record.raw_app_meta_data.provider}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #4a5568;">
                    <strong>Phone:</strong>
                  </td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #2d3748;">
                    ${record.phone || 'Not provided'}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #4a5568;">
                    <strong>Role:</strong>
                  </td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #2d3748;">
                    ${record.role || 'Default'}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #4a5568;">
                    <strong>Signed Up:</strong>
                  </td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #2d3748;">
                    ${signupDate}
                  </td>
                </tr>
              </table>
            </div>

            <div style="text-align: center; margin-top: 20px; color: #718096; font-size: 0.875rem;">
              <p>This is an automated message from AI Film Studio's notification system</p>
            </div>
          </body>
        </html>
      `
    });

    console.log('✅ Notification sent successfully');

    return NextResponse.json({ 
      success: true,
      message: 'Notification sent successfully'
    });

  } catch (error) {
    console.error('❌ Error processing request:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const isValidationError = typeof errorMessage === 'string' && errorMessage.includes('Invalid');
    
    return NextResponse.json({ 
      error: errorMessage,
      success: false
    }, { 
      status: isValidationError ? 400 : 500 
    });
  }
}