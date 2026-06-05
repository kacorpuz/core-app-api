import type { Route } from "./+types/api.epf-client-debt-summary";

export async function loader({ context, request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const clientSearch = url.searchParams.get("clientid");

  interface ClientSettlementInfo {
    CftId: string;
    DmId: number;
    ForthId: number;
    AccountNumber: string;
    DebtID: number;
    CreditorID: number;
    CreditorName: string;
    SettlementID: number;
    FeePercent: string;
    EnrolledAmount: number;
    SettlementAmount: number;
    CurrentAmount: number;
    SettlementFee: number;
  }

  interface SettlementResponse {
    EpfRebalancer: ClientSettlementInfo[];
  }

  interface AllDebtTransactionsInfo {
    ClientID: number;
    ExternalID: string;
    ContactID: number;
    ClientName: string;
    Balance: number;
    AccountNumber: string;
    CreditorName: string;
    DebtId: number;
    EnrollmentStatus: string;
    ScheduleDateOriginal: string;
    ScheduleDateAdjusted: string;
    ID: number;
    TableName: string;
    TransactionStatus: string;
    Amount: number;
    Type: string;
    ClientType: string;
    CFTTransactionId: number;
    TransactionTitle: string;
    OriginalTransStatus: string;
    SubTypeName: string;
  }

  interface AllDebtTransactionsResponse {
    EpfRebalancer: AllDebtTransactionsInfo[];
  }

  // The lowercase shape produced by settlementMappedData
  interface MappedSettlementInfo {
    cftId: string;
    dmId: number;
    forthId: number;
    clientAcctNo: string;
    debtId: number;
    creditorId: number;
    creditorName: string;
    settlementId: number;
    feePercent: string;
    enrolledAmount: number;
    settlementAmount: number;
    currentAmount: number;
    settlementFee: number;
  }

  // Enriched transaction = a debt transaction merged with its settlement info
  interface EnrichedTransaction extends AllDebtTransactionsInfo {
    CreditorId: string;
    FeePercent: string;
    EnrolledAmount: number;
    SettlementAmount: number;
    SettlementFee: number;
  }

  interface GroupedResult {
    debtId: number;
    totalAmount: number;
    statusTrans: string;
    creditorName: string;
    accountNumber: string;
    feePercent: string;
    enrolledAmount: number;
    settlementAmount: number;
    settlementFee: number;
  }

  // ---- helpers ----
  const buildTransactions = (
    sourceData: AllDebtTransactionsInfo[],
    settlementData: MappedSettlementInfo[]
  ): EnrichedTransaction[] =>
    settlementData.reduce<EnrichedTransaction[]>((transactions, client) => {
      const clientTransactions = sourceData
        .filter(trans => trans.DebtId === client.debtId)
        .map(trans => ({
          ...trans,
          CreditorId: client.cftId,
          FeePercent: client.feePercent,
          EnrolledAmount: client.enrolledAmount,
          SettlementAmount: client.settlementAmount,
          SettlementFee: client.settlementFee,
          CreditorName: trans.CreditorName || client.creditorName,
          AccountNumber: trans.AccountNumber || client.clientAcctNo
        }));
      return [...transactions, ...clientTransactions];
    }, []);

  const groupByDebtId = (
    items: EnrichedTransaction[],
    statusTrans: string
  ): GroupedResult[] =>
    Object.values(
      items.reduce<Record<number, GroupedResult>>((acc, payment) => {
        const debtId = payment.DebtId;
        if (!acc[debtId]) {
          acc[debtId] = {
            debtId,
            totalAmount: 0,
            statusTrans,
            creditorName: payment.CreditorName,
            accountNumber: payment.AccountNumber,
            feePercent: payment.FeePercent,
            enrolledAmount: payment.EnrolledAmount,
            settlementAmount: payment.SettlementAmount,
            settlementFee: payment.SettlementFee
          };
        }
        acc[debtId].totalAmount += Number(payment.Amount) || 0;
        acc[debtId].totalAmount = Number(acc[debtId].totalAmount.toFixed(2));
        return acc;
      }, {})
    );

  const isFee = (item: EnrichedTransaction): boolean =>
    !!item.TransactionTitle &&
    item.TransactionTitle.toLowerCase().includes('fee') &&
    item.TransactionTitle !== 'Disbursement Fee';

  const isPayment = (item: EnrichedTransaction): boolean =>
    !!item.TransactionTitle &&
    item.TransactionTitle.toLowerCase().includes('payment') &&
    !item.TransactionTitle.toLowerCase().includes('fee');

  // --- Auth: require a valid bearer token on the incoming request ---
  const authHeader = request.headers.get("Authorization");
  const incomingToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!incomingToken || incomingToken !== context.cloudflare.env.API_AUTH_TOKEN_EPF_DEBT_SUMMARY) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  // -----------------------------------------------------------------

  if (!clientSearch) {
    return Response.json({ error: "clientid is required" }, { status: 400 });
  }

  // Get Latest Valid Token
  const validToken = await context.cloudflare.env.CORE_APP_DB
    .prepare("SELECT * FROM data_api_tokens ORDER BY rowid DESC LIMIT 1")
    .first<{ token: string }>();

  // ========================================================================
  // Settlement info
  const clientSettlementInfoResponse = await fetch(
    `https://api.pacificdebt.com:14344/api/EpfRebalancer/GetSettlementInfoByClientId/` + clientSearch,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${validToken?.token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!clientSettlementInfoResponse.ok) {
    return Response.json(
      { error: "External API request failed" },
      { status: clientSettlementInfoResponse.status }
    );
  }

  const clientSettlementInfoData =
    (await clientSettlementInfoResponse.json()) as SettlementResponse;

  const settlementList = clientSettlementInfoData.EpfRebalancer ?? [];

  if (!Array.isArray(settlementList)) {
    return Response.json({ error: "Unexpected response format" }, { status: 502 });
  }

  const settlementMappedData: MappedSettlementInfo[] = settlementList.map(item => ({
    cftId: item.CftId,
    dmId: item.DmId,
    forthId: item.ForthId,
    clientAcctNo: item.AccountNumber,
    debtId: item.DebtID,
    creditorId: item.CreditorID,
    creditorName: item.CreditorName,
    settlementId: item.SettlementID,
    feePercent: item.FeePercent,
    enrolledAmount: item.EnrolledAmount,
    settlementAmount: item.SettlementAmount,
    currentAmount: item.CurrentAmount,
    settlementFee: item.SettlementFee,
  }));

  // Deduplicate based on stringified objects
  const clientSettlementInfoFinalData = [
    ...new Map(settlementMappedData.map(item => [JSON.stringify(item), item])).values(),
  ];

  // ========================================================================
  // Debt transactions
  const clientDebtTransactionsResponse = await fetch(
    `https://api.pacificdebt.com:14344/api/EpfRebalancer/GetDataByClientId?ClientId=` + clientSearch,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${validToken?.token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!clientDebtTransactionsResponse.ok) {
    return Response.json(
      { error: "External API request failed" },
      { status: clientDebtTransactionsResponse.status }
    );
  }

  const clientDebtTransactionsData =
    (await clientDebtTransactionsResponse.json()) as AllDebtTransactionsResponse;

  const debtList = clientDebtTransactionsData.EpfRebalancer ?? [];

  if (!Array.isArray(debtList)) {
    return Response.json({ error: "Unexpected response format" }, { status: 502 });
  }

  // ========================================================================
  // Filter by status (only those WITH a DebtId feed the pipeline)
  const completedTransData = debtList.filter(item => item.DebtId && item.TransactionStatus === 'COMPLETED');
  const scheduledTransData = debtList.filter(item => item.DebtId && item.TransactionStatus === 'SCHEDULED');
  const pendingTransData   = debtList.filter(item => item.DebtId && item.TransactionStatus === 'PENDING');

  const allPendingAndScheduledTransData = [...scheduledTransData, ...pendingTransData];

  const allCompletedTransactions = buildTransactions(completedTransData, clientSettlementInfoFinalData);
  const allPendingTransactions   = buildTransactions(pendingTransData, clientSettlementInfoFinalData);
  const allScheduledTransactions = buildTransactions(scheduledTransData, clientSettlementInfoFinalData);

  const collectedFeeResults  = groupByDebtId(allCompletedTransactions.filter(isFee), 'Collected Fee');
  const pendingFeeResults    = groupByDebtId(allPendingTransactions.filter(isFee), 'Pending Fee');
  const scheduledFeesResults = groupByDebtId(allScheduledTransactions.filter(isFee), 'Scheduled Fee');

  const collectedPaymentsResults = groupByDebtId(
    allCompletedTransactions.filter(item =>
      isPayment(item) && item.OriginalTransStatus?.toLowerCase().includes('cleared')
    ),
    'Collected Payment'
  );

  const pendingPaymentsResults = groupByDebtId(
    buildTransactions(allPendingAndScheduledTransData, clientSettlementInfoFinalData).filter(isPayment),
    'Pending Payment'
  );

  return Response.json({
    Get_Collected_Fees: collectedFeeResults,
    Get_Pending_Fees: pendingFeeResults,
    Get_Scheduled_Fees: scheduledFeesResults,
    Get_Collected_Payments: collectedPaymentsResults,
    Get_Pending_Payments: pendingPaymentsResults,
  });
}