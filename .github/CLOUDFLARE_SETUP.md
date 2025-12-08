# Cloudflare Pages - Konfiguracja Deployment

Ten dokument opisuje kroki niezbędne do skonfigurowania automatycznego wdrażania aplikacji na Cloudflare Pages za pomocą GitHub Actions.

## Wymagane sekrety GitHub

Aby workflow `master.yml` działał poprawnie, musisz skonfigurować następujące sekrety w swoim repozytorium GitHub:

### 1. CLOUDFLARE_API_TOKEN

**Opis:** Token API Cloudflare z uprawnieniami do Cloudflare Pages.

**Jak uzyskać:**

1. Zaloguj się do [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Przejdź do **My Profile** → **API Tokens**
3. Kliknij **Create Token**
4. Wybierz **Custom Token** lub użyj szablonu **Edit Cloudflare Workers**
5. Skonfiguruj uprawnienia:
   - **Account** → **Cloudflare Pages** → **Edit**
6. Kliknij **Continue to summary** → **Create Token**
7. Skopiuj wygenerowany token (będzie widoczny tylko raz!)

### 2. CLOUDFLARE_ACCOUNT_ID

**Opis:** Identyfikator konta Cloudflare.

**Jak uzyskać:**

1. Zaloguj się do [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. W prawym panelu bocznym znajdziesz **Account ID**
3. Możesz go również znaleźć w URL: `https://dash.cloudflare.com/{ACCOUNT_ID}/...`

### 3. CLOUDFLARE_PROJECT_NAME

**Opis:** Nazwa projektu Cloudflare Pages (istniejącego lub nowego).

**Jak uzyskać/ustawić:**

1. Zaloguj się do [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Przejdź do **Workers & Pages**
3. Jeśli projekt już istnieje, użyj jego nazwy
4. Jeśli tworzysz nowy projekt:
   - Kliknij **Create application** → **Pages** → **Connect to Git** lub **Direct Upload**
   - Wprowadź nazwę projektu (np. `daily-meal-plan`)

### 4. SUPABASE_URL

**Opis:** URL instancji Supabase.

**Jak uzyskać:**

1. Zaloguj się do [Supabase Dashboard](https://app.supabase.com/)
2. Wybierz swój projekt
3. Przejdź do **Settings** → **API**
4. Skopiuj wartość **Project URL**

### 5. SUPABASE_KEY

**Opis:** Klucz API Supabase (anon/public key).

**Jak uzyskać:**

1. Zaloguj się do [Supabase Dashboard](https://app.supabase.com/)
2. Wybierz swój projekt
3. Przejdź do **Settings** → **API**
4. Skopiuj wartość **anon** **public** key

⚠️ **Uwaga:** Nigdy nie używaj `service_role` key w aplikacji frontendowej!

## Dodawanie sekretów do GitHub

1. Przejdź do swojego repozytorium na GitHub
2. Kliknij **Settings** → **Secrets and variables** → **Actions**
3. Kliknij **New repository secret**
4. Dodaj każdy z powyższych sekretów:
   - Name: nazwa sekretu (np. `CLOUDFLARE_API_TOKEN`)
   - Secret: wartość sekretu
5. Kliknij **Add secret**

## Konfiguracja środowiska "production"

Workflow `master.yml` używa środowiska GitHub o nazwie **production**. Aby je skonfigurować:

1. Przejdź do **Settings** → **Environments**
2. Kliknij **New environment**
3. Wprowadź nazwę: `production`
4. (Opcjonalnie) Dodaj reguły ochrony:
   - Required reviewers (wymagaj zatwierdzenia przed deploymentem)
   - Wait timer (opóźnienie przed deploymentem)
   - Deployment branches (ogranicz do konkretnych gałęzi)

## Testowanie workflow

Po skonfigurowaniu wszystkich sekretów:

1. Upewnij się, że kod jest w gałęzi `main` lub `master`
2. Wykonaj commit i push do gałęzi głównej
3. Przejdź do **Actions** w GitHub i obserwuj wykonanie workflow `master`
4. Po pomyślnym wdrożeniu, aplikacja będzie dostępna pod adresem Cloudflare Pages

## Troubleshooting

### Błąd: "Error: Missing required parameter: apiToken"

- Sprawdź, czy sekret `CLOUDFLARE_API_TOKEN` jest poprawnie ustawiony

### Błąd: "Error: Could not find project"

- Sprawdź, czy `CLOUDFLARE_PROJECT_NAME` odpowiada nazwie istniejącego projektu w Cloudflare Pages
- Upewnij się, że projekt został utworzony w Cloudflare Dashboard

### Błąd: "Error: Unauthorized"

- Sprawdź, czy token API ma odpowiednie uprawnienia (Cloudflare Pages - Edit)
- Sprawdź, czy `CLOUDFLARE_ACCOUNT_ID` jest poprawny

### Build kończy się sukcesem, ale strona nie działa

- Sprawdź, czy zmienne środowiskowe `SUPABASE_URL` i `SUPABASE_KEY` są poprawnie ustawione
- Sprawdź logi w Cloudflare Dashboard → Workers & Pages → Twój projekt → Logs

## Dodatkowe zasoby

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Wrangler Action GitHub Repository](https://github.com/cloudflare/wrangler-action)
- [Supabase Documentation](https://supabase.com/docs)

