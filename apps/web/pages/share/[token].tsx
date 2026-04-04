useEffect(() => {
  fetch(`https://api.mecpro.tec.br/api/public/share/${token}`)
    .then(res => res.json())
    .then(data => setPdfUrl(data.pdfUrl));
}, []);