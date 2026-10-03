$p = 'server\finance\routes.ts'

$s = [System.IO.File]::ReadAllText($p)

$oldImport = @"
  financeAccounts as companyFinanceAccounts,
  financeExpenses,
"@

$newImport = @"
  financeAccounts as companyFinanceAccounts,
  financeTransactions as companyFinanceTransactions,
  financeExpenses,
"@

if (-not $s.Contains($oldImport)) {
    throw 'Expected finance import section was not found'
}

$s = $s.Replace($oldImport, $newImport)

$startMarker = "router.post('/company/transactions'"
$start = $s.IndexOf($startMarker)

if ($start -lt 0) {
    throw 'Company transactions route was not found'
}

$end = $s.IndexOf("`n})", $start)

if ($end -lt 0) {
    throw 'End of company transactions route was not found'
}

$end = $end + 3

$route = $s.Substring($start, $end - $start)

$route = $route.Replace('financeTransactions)', 'companyFinanceTransactions)')
$route = $route.Replace('financeTransactions)', 'companyFinanceTransactions)')

$s = $s.Substring(0, $start) + $route + $s.Substring($end)

[System.IO.File]::WriteAllText($p, $s)