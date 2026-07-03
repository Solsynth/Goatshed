import { db } from "~~/server/utils/db";
import { orders } from "~~/server/db/index";
import { getCachedSolarProfile } from "~~/server/utils/solarProfile";
import { snFetch } from "~~/server/utils/sn-api";

const PRODUCT_SKUS: Record<string, string> = {
  donation: "littlesheep.goatshed.donation",
  gaming: "littlesheep.goatshed.gaming",
};

export default defineEventHandler(async (event) => {
  const session = event.context.session;
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: "Not authenticated" });
  }

  const body = await readBody(event);
  const productType = body.product && PRODUCT_SKUS[body.product] ? body.product : "donation";
  const quantity = Math.max(1, Math.min(100, Number(body.quantity) || 1));
  const message = typeof body.message === "string" ? body.message.slice(0, 200) : undefined;

  const config = useRuntimeConfig(event);
  const clientId = process.env.DONATION_API_KEY_CLIENT_ID;
  const clientSecret = process.env.DONATION_API_KEY_SECRET;

  if (!clientId || !clientSecret) {
    throw createError({ statusCode: 500, statusMessage: "Payment API not configured" });
  }

  const sku = PRODUCT_SKUS[productType];

  const orderResponse = await snFetch<Record<string, any>>(
    event,
    "/wallet/orders",
    {
      method: "POST",
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        duration_hours: 24,
        items: [{ product_identifier: sku, quantity }],
        remarks: message || undefined,
      }),
    },
  );

  const orderId = orderResponse.id;
  const amount = String(orderResponse.amount);
  const currency = orderResponse.currency;

  await db.insert(orders).values({
    orderId,
    userId: session.user.id,
    productType,
    amount,
    currency,
    quantity,
    remarks: message || null,
    status: "待支付",
  });

  const profile = await getCachedSolarProfile(session.user.id);

  return {
    orderId,
    amount,
    currency,
    quantity,
    productType,
    payUrl: `https://solian.app/orders/${orderId}`,
    donorName: profile?.profile?.nick || profile?.name || session.user.name,
    donorAvatar: profile?.name
      ? `${config.public.apiBaseUrl}/passport/accounts/${encodeURIComponent(profile.name)}/picture`
      : null,
  };
});
