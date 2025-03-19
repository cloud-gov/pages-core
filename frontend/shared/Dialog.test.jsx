import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import '@testing-library/jest-dom';
import Dialog from './Dialog';

describe('Dialog Component', () => {
  const mockPrimaryHandler = jest.fn();
  const mockSecondaryHandler = jest.fn();
  const mockCloseHandler = jest.fn();
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders nothing by default', () => {
    const { container } = render(<Dialog primaryHandler={mockPrimaryHandler} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when open is explicitly false', () => {
    const { container } = render(
      <Dialog open={false} primaryHandler={mockPrimaryHandler} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders correctly when open is true', () => {
    render(<Dialog open={true} primaryHandler={mockPrimaryHandler} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to continue?')).toBeInTheDocument();
    expect(
      screen.getByText('You have unsaved changes that will be lost.'),
    ).toBeInTheDocument();
  });

  it('renders custom header and message', () => {
    render(
      <Dialog
        open={true}
        header="Delete File?"
        message="Are you sure you want to delete this file?"
        primaryHandler={mockPrimaryHandler}
      />,
    );
    expect(screen.getByText('Delete File?')).toBeInTheDocument();
    expect(
      screen.getByText('Are you sure you want to delete this file?'),
    ).toBeInTheDocument();
  });

  it('renders primary and secondary buttons', () => {
    render(
      <Dialog
        primaryHandler={mockPrimaryHandler}
        open={true}
        primaryButton="Confirm"
        secondaryButton="Cancel"
      />,
    );
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('calls primaryHandler when primary button is clicked', async () => {
    render(
      <Dialog open={true} primaryButton="Confirm" primaryHandler={mockPrimaryHandler} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(mockPrimaryHandler).toHaveBeenCalledTimes(1);
  });

  it('calls secondaryHandler when secondary button is clicked', async () => {
    render(
      <Dialog
        open={true}
        secondaryButton="Cancel"
        secondaryHandler={mockSecondaryHandler}
        primaryHandler={mockPrimaryHandler}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(mockSecondaryHandler).toHaveBeenCalledTimes(1);
  });

  it('calls closeHandler when clicking the close button', async () => {
    render(
      <Dialog
        open={true}
        primaryHandler={mockPrimaryHandler}
        closeHandler={mockCloseHandler}
      />,
    );
    await userEvent.click(screen.getByLabelText('Close this window'));
    expect(mockCloseHandler).toHaveBeenCalledTimes(1);
  });

  it('calls closeHandler when clicking the overlay if dismissable', async () => {
    render(
      <Dialog
        open={true}
        dismissable={true}
        primaryHandler={mockPrimaryHandler}
        closeHandler={mockCloseHandler}
      />,
    );
    await userEvent.click(screen.getByTestId('modal-overlay'));
    expect(mockCloseHandler).toHaveBeenCalledTimes(1);
  });

  it('does not call closeHandler when clicking overlay if not dismissable', async () => {
    render(
      <Dialog
        open={true}
        dismissable={false}
        primaryHandler={mockPrimaryHandler}
        closeHandler={mockCloseHandler}
      />,
    );
    // eslint-disable-next-line testing-library/no-node-access
    await userEvent.click(screen.getByRole('dialog').parentElement);
    expect(mockCloseHandler).not.toHaveBeenCalled();
  });

  it('closes when Escape key is pressed if dismissable', async () => {
    render(
      <Dialog
        primaryHandler={mockPrimaryHandler}
        open={true}
        dismissable={true}
        closeHandler={mockCloseHandler}
      />,
    );
    await userEvent.keyboard('{Escape}');
    expect(mockCloseHandler).toHaveBeenCalledTimes(1);
  });

  it('does not close when Escape key is pressed if not dismissable', async () => {
    render(
      <Dialog
        open={true}
        dismissable={false}
        primaryHandler={mockPrimaryHandler}
        closeHandler={mockCloseHandler}
      />,
    );
    await userEvent.keyboard('{Escape}');
    expect(mockCloseHandler).not.toHaveBeenCalled();
  });

  it('traps focus inside the modal', async () => {
    render(
      <Dialog
        open={true}
        primaryHandler={mockPrimaryHandler}
        primaryButton="Confirm"
        secondaryButton="Cancel"
      />,
    );

    // this is the order they show up in the DOM
    const confirmButton = screen.getByRole('button', { name: 'Confirm' });
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    const closeButton = screen.getByLabelText('Close this window');

    confirmButton.focus();
    expect(confirmButton).toHaveFocus();

    await userEvent.tab();
    expect(cancelButton).toHaveFocus();

    await userEvent.tab();
    expect(closeButton).toHaveFocus();

    await userEvent.tab();
    expect(confirmButton).toHaveFocus();
  });

  it('restores focus to the previously focused element when closed', async () => {
    const { rerender } = render(
      <>
        <button data-testid="outside-button">Outside</button>
        <Dialog
          open={false}
          primaryHandler={mockPrimaryHandler}
          closeHandler={jest.fn()}
        />
      </>,
    );

    const outsideButton = screen.getByTestId('outside-button');

    outsideButton.focus();
    expect(outsideButton).toHaveFocus();
    rerender(
      <>
        <button data-testid="outside-button">Outside</button>
        <Dialog
          open={true}
          primaryHandler={mockPrimaryHandler}
          closeHandler={jest.fn()}
        />
      </>,
    );

    expect(screen.getByRole('button', { name: 'Continue without saving' })).toHaveFocus();
    rerender(
      <>
        <button data-testid="outside-button">Outside</button>
        <Dialog
          open={false}
          primaryHandler={mockPrimaryHandler}
          closeHandler={jest.fn()}
        />
      </>,
    );
    await waitFor(() => {
      expect(outsideButton).toHaveFocus();
    });
  });
});
