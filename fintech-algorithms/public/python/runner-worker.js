let runtime=null;
const base=new URL('./',self.location.href).href;
self.onmessage=async event=>{
 const {code}=event.data;let output='',errors='';
 try{
  if(!runtime){self.postMessage({type:'status',text:'Loading the bundled Python runtime…'});importScripts(base+'pyodide.js');runtime=await loadPyodide({indexURL:base});}
  runtime.setStdout({batched:s=>output+=s+'\n'});runtime.setStderr({batched:s=>errors+=s+'\n'});
  self.postMessage({type:'status',text:'Loading local scientific packages…'});
  await runtime.loadPackage(['numpy','pandas','scikit-learn','statsmodels','networkx','matplotlib']);
  output='';errors='';
  await runtime.runPythonAsync("import matplotlib\nmatplotlib.use('Agg')\nimport matplotlib.pyplot as plt\nplt.close('all')");
  self.postMessage({type:'status',text:'Running your code…'});
  await runtime.runPythonAsync(code);
  const figures=await runtime.runPythonAsync("import io, base64, json\n_images=[]\nfor _n in plt.get_fignums():\n    _b=io.BytesIO()\n    plt.figure(_n).savefig(_b,format='png',bbox_inches='tight')\n    _images.append('data:image/png;base64,'+base64.b64encode(_b.getvalue()).decode())\njson.dumps(_images)");
  self.postMessage({type:'result',stdout:output,stderr:errors,figures:JSON.parse(figures)});
 }catch(e){self.postMessage({type:'result',stdout:output,stderr:errors+'\n'+String(e),figures:[]});}
};
