export async function initializeOfflineControls() {
  const prepare = document.querySelector<HTMLButtonElement>('[data-offline-prepare]');
  const remove = document.querySelector<HTMLButtonElement>('[data-offline-remove]');
  const message = document.querySelector<HTMLElement>('[data-offline-message]');
  const progress = document.querySelector<HTMLProgressElement>('[data-offline-progress]');
  if (!prepare || !remove || !message || !progress) return;
  const disabled = (value: boolean) => { prepare.disabled = value; remove.disabled = value; };
  if (!('serviceWorker' in navigator) || !window.isSecureContext) {
    disabled(true); message.textContent = 'Offline downloads need service worker support and a secure connection.'; return;
  }
  try {
    const registration = await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`);
    await navigator.serviceWorker.ready;
    const action = (type: string) => new Promise<any>((resolve, reject) => {
      const channel = new MessageChannel();
      channel.port1.onmessage = ({ data }) => {
        if (data.type === 'progress') {
          progress.hidden = false; progress.value = 100 * data.completed / data.total;
          message.textContent = `Downloading ${Math.round(progress.value)}% · ${(data.bytes / 1048576).toFixed(1)} of ${(data.totalBytes / 1048576).toFixed(1)} MiB`; return;
        }
        channel.port1.close(); data.type === 'error' ? reject(new Error(data.message)) : resolve(data);
      };
      const worker = registration.active || navigator.serviceWorker.controller;
      if (!worker) { channel.port1.close(); reject(new Error('Offline service is not ready. Reload and retry.')); return; }
      worker.postMessage({ type }, [channel.port2]);
    });
    const render = (data: any) => {
      remove.hidden = !data.ready; progress.hidden = true; prepare.hidden = data.current;
      prepare.textContent = data.ready ? 'Update offline copy' : 'Make available offline';
      message.textContent = data.current ? 'Offline copy complete. Lessons, search, Python examples, and notebooks are available.' : data.ready ? `A course update is available (${(data.totalBytes / 1048576).toFixed(1)} MiB). Your previous offline copy is still available.` : `Optional download: ${(data.totalBytes / 1048576).toFixed(1)} MiB. Your learning progress is kept separately.`;
    };
    render(await action('STATUS'));
    prepare.addEventListener('click', async () => {
      disabled(true);
      try { render(await action('PREPARE')); }
      catch (error) { message.textContent = `${(error as Error).message} Your previous complete copy and learning progress are preserved.`; prepare.textContent = 'Retry offline download'; }
      finally { disabled(false); }
    });
    remove.addEventListener('click', async () => {
      disabled(true);
      try { render(await action('REMOVE')); message.textContent += ' Learning progress was preserved.'; }
      catch (error) { message.textContent = (error as Error).message; }
      finally { disabled(false); }
    });
  } catch { disabled(true); message.textContent = 'Offline service is unavailable. The online course remains usable.'; }
}
