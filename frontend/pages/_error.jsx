import { Component } from 'react';
import Link from 'next/link';

class Error extends Component {
  static getInitialProps({ res, err }) {
    const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
    return { statusCode };
  }

  render() {
    const { statusCode } = this.props;
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-white">
        <div className="max-w-md w-full bg-white shadow-xl rounded-2xl p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
            {statusCode ? `Error ${statusCode}` : 'An Error Occurred'}
          </h1>
          <p className="text-gray-600 mb-8">
            {statusCode === 404
              ? 'The page you are looking for could not be found.'
              : 'Something went wrong. Please try again later.'}
          </p>
          <div className="space-y-4">
            <Link
              href="/"
              className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition font-semibold"
            >
              Go Home
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="block w-full text-primary-600 hover:text-primary-700 transition font-medium"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default Error;
