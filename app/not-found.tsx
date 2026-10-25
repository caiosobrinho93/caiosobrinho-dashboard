import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page">
      <div className="breadcrumb">
        <span>~</span>
        <span className="slash">/</span>
        <span className="current">404</span>
      </div>
      <h1 className="page-title">Arquivo não encontrado</h1>
      <p className="page-subtitle">
        Essa rota não existe no workspace. Talvez o arquivo tenha sido movido ou nunca existiu.
      </p>
      <div>
        <Link className="btn btn-primary" href="/">
          Voltar ao início
        </Link>
      </div>
      <pre className="backend-code" style={{ maxWidth: 460 }}>
        <span className="token-comment">{"// erro 404"}</span>
        {"\n"}
        <span className="token-key">const</span> rota = <span className="token-string">"inexistente"</span>;
        {"\n"}
        <span className="token-key">return</span> inicio();
      </pre>
    </div>
  );
}
