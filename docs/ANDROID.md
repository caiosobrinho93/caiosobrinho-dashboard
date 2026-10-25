# App Android

O dashboard roda como um app Android híbrido com **Capacitor 8**. O Next.js é exportado como
site estático (`out/`) e esse conteúdo é copiado para dentro do WebView nativo em
`android/app/src/main/assets/public/`.

O shell nativo cuida de:

- splash screen e ícones adaptativos;
- status bar/navigation bar escuras e edge-to-edge com safe areas;
- botão físico de voltar;
- haptics em ações de toque;
- redimensionamento do WebView quando o teclado abre.

Os dados continuam no `localStorage` do WebView. Não há servidor nem login nesta fase.

## Identidade

| Item | Valor |
| --- | --- |
| Nome exibido | Dashboard Pessoal |
| Application ID | `com.caiosobrinho.dashboardpessoal` |
| minSdk | 24 (Android 7.0) |
| compileSdk / targetSdk | 36 |
| Gradle | 8.14.3 |
| Android Gradle Plugin | 8.13.0 |

## Pré-requisitos

Para gerar o APK localmente você precisa de:

- **Node.js 20.9+** e npm (o workflow usa Node 22);
- **JDK 21**;
- **Android Studio** atualizado;
- **Android SDK Platform 36**, Build-Tools 36 e Platform-Tools;
- um aparelho Android com depuração USB ou um emulador criado no Device Manager.

O Gradle Wrapper já está no projeto; não é necessário instalar Gradle separadamente. Também não
é necessário instalar o Capacitor globalmente: os comandos usam o CLI local em `node_modules`.

### JDK e SDK no Windows

O Android Studio atual já vem com um JDK 21 em `jbr`. Se você não tiver outro JDK instalado,
aponte o `JAVA_HOME` para ele:

```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:Path += ";$env:ANDROID_HOME\platform-tools"
```

Para tornar isso permanente, cadastre `JAVA_HOME` e `ANDROID_HOME` nas variáveis de ambiente do
Windows. O caminho do SDK pode ser visto em **Android Studio → Settings → Languages & Frameworks
→ Android SDK**. Instale nele:

- **SDK Platform 36**;
- **Android SDK Build-Tools 36** (ou a versão mais recente compatível);
- **Android SDK Platform-Tools**;
- **Android Emulator** e uma system image, se for usar emulador.

Confira em um terminal novo:

```powershell
java -version
adb version
```

Se o Gradle não encontrar o SDK, crie `android/local.properties` (esse arquivo é ignorado pelo
Git):

```properties
sdk.dir=C\:\\Users\\SEU_USUARIO\\AppData\\Local\\Android\\Sdk
```

## Build e execução

Instale as dependências uma vez:

```powershell
npm install
```

Sempre que alterar o frontend, sincronize o build web com o projeto nativo:

```powershell
npm run android:sync
```

Esse comando executa `npm run build`, copia `out/` para dentro do Android e atualiza plugins e
configuração do Capacitor. Não edite `android/app/src/main/assets/public/` manualmente: ele é
gerado e será sobrescrito.

### Pelo Android Studio

```powershell
npm run android:open
```

No Android Studio:

1. Aguarde o Gradle Sync terminar.
2. Selecione um aparelho ou emulador no topo da janela.
3. Clique em **Run** (Shift+F10).

Se alterou o frontend depois de abrir o Android Studio, rode `npm run android:sync` e execute
novamente.

### Por linha de comando

Com um aparelho/emulador conectado:

```powershell
npm run android:run
```

Ou gere o APK de debug:

```powershell
npm run android:apk
```

Saída:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

Instalação via ADB:

```powershell
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

Se houver mais de um dispositivo conectado, descubra o ID com `adb devices` e use
`adb -s ID_DO_DISPOSITIVO install -r ...`.

### Emulador

No Android Studio, abra **Device Manager → Create Virtual Device**, escolha um Pixel e uma system
image com API 36 (ou API 35). Inicie o emulador antes de rodar `npm run android:run` ou use o
botão **Run** do Android Studio.

## Atualizar ícone e splash

Os arquivos-fonte ficam em `resources/icon.png` e `resources/splash.png`. Depois de trocá-los:

```powershell
npm run android:assets
npm run android:sync
```

O script gera os tamanhos de launcher, ícones adaptativos, splash em retrato/paisagem e as cores
do tema. Os PNGs web (`public/icon-*.png`, `public/apple-touch-icon.png`) são regenerados por:

```powershell
npm run icons
```

## CI: APK de debug no GitHub Actions

O workflow fica em `.github/workflows/android-debug.yml`. Ele roda:

- em cada push para a branch `main`;
- manualmente em **Actions → Android debug APK → Run workflow**.

O job instala Node 22, JDK 21 e Android SDK, roda o build estático, sincroniza o Capacitor e
executa `./gradlew assembleDebug`. O APK fica no artifact **dashboard-pessoal-debug**.

Para usar o workflow, o projeto precisa estar em um repositório GitHub com Actions habilitado.
O APK gerado é de **debug**, não assinado para publicação, e deve ser instalado com "instalar de
fontes desconhecidas" liberado no aparelho (ou via `adb install`).

## Assinatura e release

O APK de debug serve para teste. Para distribuir fora do Play Store ou publicar, crie uma chave
de release e mantenha o keystore e as senhas fora do Git.

### Opção 1: Android Studio

1. **Build → Generate Signed App Bundle / APK**.
2. Escolha **APK** (ou **Android App Bundle** para o Play Store).
3. Em **Create new**, defina o caminho do keystore, alias e senhas.
4. Selecione **release** e conclua.
5. O APK fica em `android/app/release/` (o caminho exato aparece no final do assistente).

Guarde o arquivo `.jks`, o alias e as senhas em um gerenciador de segredos. Sem eles não é
possível publicar atualizações do mesmo app.

### Opção 2: Gradle com keystore.properties

Crie o keystore na raiz do projeto:

```powershell
keytool -genkeypair -v -keystore dashboard-pessoal-release.jks `
  -alias dashboard-pessoal -keyalg RSA -keysize 2048 -validity 10000
```

Crie `android/keystore.properties` (não versionar). O caminho de `storeFile` é relativo à pasta
`android/app`, por isso `../../` aponta para a raiz do projeto:

```properties
storeFile=../../dashboard-pessoal-release.jks
storePassword=SUA_SENHA
keyAlias=dashboard-pessoal
keyPassword=SUA_SENHA
```

O `.gitignore` do projeto já ignora `*.jks`, `*.keystore` e `keystore.properties`.

Adicione o bloco `signingConfigs` dentro do `android { ... }` existente e substitua o bloco
`buildTypes` atual pelo abaixo:

```groovy
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file("keystore.properties")
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    // ...configuração existente...

    signingConfigs {
        if (keystorePropertiesFile.exists()) {
            release {
                storeFile file(keystoreProperties["storeFile"])
                storePassword keystoreProperties["storePassword"]
                keyAlias keystoreProperties["keyAlias"]
                keyPassword keystoreProperties["keyPassword"]
            }
        }
    }

    buildTypes {
        release {
            if (keystorePropertiesFile.exists()) {
                signingConfig signingConfigs.release
            }
            minifyEnabled false
            proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
        }
    }
}
```

Gere o release:

```powershell
cd android
.\gradlew assembleRelease
```

O APK assinado fica em `android/app/build/outputs/apk/release/app-release.apk`. Para publicar no
Play Store, prefira `bundleRelease` e envie o `.aab` gerado em
`android/app/build/outputs/bundle/release/app-release.aab`.

Antes de publicar uma atualização, aumente `versionCode` e `versionName` em
`android/app/build.gradle`. O `versionCode` precisa ser sempre maior que o anterior.

### CI com assinatura

Para gerar releases no GitHub Actions, cadastre o keystore em base64 e as senhas como secrets do
repositório e decodifique o keystore em um passo anterior ao Gradle. Nunca coloque o `.jks` nem
`keystore.properties` no repositório. O workflow atual é intencionalmente apenas de debug.

## O que é nativo e o que é web

- **Nativo:** janela, splash, ícones, status/navigation bars, insets de safe area, teclado,
  vibração e botão físico de voltar.
- **Web:** todas as telas, formulários, gráficos, command palette, animações e persistência em
  `localStorage`.
- **Rede:** o app abre sem internet; as miniaturas do YouTube só carregam quando houver conexão.
- **Backup:** os dados ficam no armazenamento do WebView. Desinstalar o app apaga tudo. Exporte
  o JSON em **Configurações → Dados e backup** antes de trocar de aparelho ou limpar os dados.

O botão físico de voltar segue esta ordem: fecha a command palette, fecha modal/confirmação,
volta uma rota e, no início, sai do app.

## Limitações e observações

- As View Transitions usam a API do navegador/WebView. Em WebViews muito antigos (Chrome/WebView
  anterior à versão 125), a navegação continua funcionando, mas sem a transição animada.
- O app foi configurado para Android 7.0+; recomenda-se Android 10+ e WebView atualizado.
- O workflow e o build local não assinam o APK de debug.
- O projeto não usa deep links externos nesta fase. As rotas são internas ao app.
- Se o Gradle reclamar de versão de Java, confirme `java -version` e `JAVA_HOME`; o projeto
  espera JDK 21.
