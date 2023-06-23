import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import LoadingSpinner from '@/components/LoadingSpinner';
import Datepicker from "react-tailwindcss-datepicker";
import Alert from '@/components/Alert'

export default function ModalExport({ team, bot, open, setOpen }) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorText, setErrorText] = useState(null)
  const [infoText, setInfoText] = useState(null)
  const [value, setValue] = useState({
    startDate: bot.createdAt,
    endDate: new Date()
  });

  const downloadLogs = async () => {
    if (isProcessing) {
      return
    }
    setIsProcessing(true)

    // ask api to generate logs
    const apiUrl = `/api/teams/${team.id}/bots/${bot.id}/export-log?startDate=${value.startDate.toString()}&endDate=${value.endDate.toString()}`;
    try {
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });
      if (response.ok) {
        // we get a signed url back
        const { url } = await response.json();
        var link = document.createElement("a");
        link.href = url;
        link.click();
        link.remove();

        setInfoText('Successfully exported logs! Your download should start soon.')
      } else {
        setErrorText('Something went wrong, please try again.')
      }
    } catch (e) {
      console.warn(e);
      setErrorText('Something went wrong, please try again.')
    }
    setIsProcessing(false)
  }

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={setOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-5xl">
                <h3 className="pt-8 px-8 inline-flex text-2xl font-bold">Export {bot.name}'s logs</h3>
                <div className="absolute top-0 right-0 hidden pt-4 pr-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                    onClick={() => setOpen(false)}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <Alert title={infoText} type="info" />
                <Alert title={errorText} type="warning" />
                <div className="overflow-visible p-6 light">
                  <label className="block text-sm font-medium text-gray-700">
                    Date range
                  </label>
                  <Datepicker
                      value={value}
                      primaryColor="cyan"
                      onChange={setValue}
                  />
                </div>
                <div className="flex flex-shrink-0 items-end justify-end px-6 pb-6 w-full">
                  <button
                    onClick={downloadLogs}
                    disabled={isProcessing}
                    type="button"
                    className="inline-flex items-center justify-center rounded-md border border-transparent bg-cyan-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-75"
                  >
                    {isProcessing ? <LoadingSpinner className='h-6 w-6 mr-2' /> : <ArrowDownTrayIcon className='h-6 w-6 mr-2'/>}
                    Export Logs
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
