"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });
    
    // Log error to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("Error caught by ErrorBoundary:", error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
          <div className="max-w-md w-full bg-card shadow-lg rounded-lg p-6 border border-border">
            <div className="flex items-center justify-center w-12 h-12 bg-destructive/10 rounded-full mx-auto mb-4">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            
            <h2 className="text-xl font-semibold text-foreground text-center mb-2">
              Something went wrong
            </h2>
            
            <p className="text-muted-foreground text-center mb-6">
              We&apos;re sorry, but something unexpected happened. Please try again.
            </p>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <div className="bg-muted rounded-lg p-4 mb-6 border border-border">
                <h3 className="font-semibold text-foreground mb-2">Error Details:</h3>
                <pre className="text-sm text-muted-foreground overflow-auto max-h-32">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </div>
            )}

            <div className="flex gap-3">
              <Button 
                onClick={this.handleRetry}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.location.reload()}
                className="border-border hover:bg-accent"
              >
                Reload Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}