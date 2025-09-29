import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { domain, displayName, userEmail, userId } = await req.json()

    // Validate input
    if (!domain || !displayName || !userEmail || !userId) {
      throw new Error('Missing required fields')
    }

    // Extract email domain for validation
    const emailDomain = userEmail.split('@')[1]
    if (emailDomain !== domain) {
      throw new Error('Email domain must match company domain')
    }

    // Check if domain already exists
    const { data: existingDomain } = await supabaseClient
      .from('domains')
      .select('id')
      .eq('name', domain)
      .maybeSingle()

    let domainId: string

    if (existingDomain) {
      domainId = existingDomain.id
    } else {
      // Create new domain
      const { data: newDomain, error: domainError } = await supabaseClient
        .from('domains')
        .insert({
          name: domain,
          display_name: displayName,
        })
        .select('id')
        .single()

      if (domainError) throw domainError
      domainId = newDomain.id
    }

    // Check if this is the first user for this domain
    const { data: existingProfiles, error: profilesError } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('domain_id', domainId)

    if (profilesError) throw profilesError

    const isFirstUser = !existingProfiles || existingProfiles.length === 0

    // Create profile
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .insert({
        id: userId,
        domain_id: domainId,
        email: userEmail,
        full_name: userEmail.split('@')[0], // Default name from email
        role: isFirstUser ? 'admin' : 'member',
      })

    if (profileError) throw profileError

    return new Response(
      JSON.stringify({ 
        success: true, 
        domainId,
        isFirstUser,
        role: isFirstUser ? 'admin' : 'member'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})