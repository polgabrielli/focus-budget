import React, { useState } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NumericKeypad } from '../Keypad/NumericKeypad';
import { BudgetProvider } from '../../context/BudgetContext';

const KeypadWrapper: React.FC<{ initialAmount?: string; initialNote?: string }> = ({
  initialAmount = '0',
  initialNote = '',
}) => {
  const [amountStr, setAmountStr] = useState(initialAmount);
  const [note, setNote] = useState(initialNote);
  const [isNoteOpen, setIsNoteOpen] = useState(false);

  return (
    <BudgetProvider>
      <NumericKeypad
        amountStr={amountStr}
        setAmountStr={setAmountStr}
        note={note}
        setNote={setNote}
        isNoteOpen={isNoteOpen}
        setIsNoteOpen={setIsNoteOpen}
      />
    </BudgetProvider>
  );
};

describe('NumericKeypad Component', () => {
  it('renders initial amount "0"', () => {
    render(<KeypadWrapper />);
    expect(screen.getByText('0', { selector: 'span.font-mono' })).toBeInTheDocument();
  });

  it('replaces leading "0" when typing a non-zero number', () => {
    render(<KeypadWrapper />);
    const button5 = screen.getByRole('button', { name: '5' });
    fireEvent.click(button5);
    expect(screen.getByText('5', { selector: 'span.font-mono' })).toBeInTheDocument();
  });

  it('accumulates digits correctly (e.g. 1500)', () => {
    render(<KeypadWrapper />);
    fireEvent.click(screen.getByRole('button', { name: '1' }));
    fireEvent.click(screen.getByRole('button', { name: '5' }));
    fireEvent.click(screen.getByRole('button', { name: '0' }));
    fireEvent.click(screen.getByRole('button', { name: '0' }));
    expect(screen.getByText('1500', { selector: 'span.font-mono' })).toBeInTheDocument();
  });

  it('handles decimals without allowing multiple dots (e.g. 25.50)', () => {
    render(<KeypadWrapper />);
    fireEvent.click(screen.getByRole('button', { name: '2' }));
    fireEvent.click(screen.getByRole('button', { name: '5' }));
    fireEvent.click(screen.getByRole('button', { name: '.' }));
    fireEvent.click(screen.getByRole('button', { name: '5' }));
    // Try to enter second dot
    fireEvent.click(screen.getByRole('button', { name: '.' }));
    fireEvent.click(screen.getByRole('button', { name: '0' }));

    expect(screen.getByText('25.50', { selector: 'span.font-mono' })).toBeInTheDocument();
  });

  it('limits decimal places to a maximum of 2', () => {
    render(<KeypadWrapper />);
    fireEvent.click(screen.getByRole('button', { name: '1' }));
    fireEvent.click(screen.getByRole('button', { name: '.' }));
    fireEvent.click(screen.getByRole('button', { name: '9' }));
    fireEvent.click(screen.getByRole('button', { name: '9' }));
    // Attempt third decimal
    fireEvent.click(screen.getByRole('button', { name: '9' }));

    expect(screen.getByText('1.99', { selector: 'span.font-mono' })).toBeInTheDocument();
  });

  it('deletes digits one by one with the backspace button', () => {
    render(<KeypadWrapper initialAmount="123" />);
    // Backspace button has title or SVG
    const backspaceButton = screen.getAllByRole('button').find((b) => b.querySelector('svg.lucide-delete'));
    expect(backspaceButton).toBeDefined();

    fireEvent.click(backspaceButton!);
    expect(screen.getByText('12', { selector: 'span.font-mono' })).toBeInTheDocument();

    fireEvent.click(backspaceButton!);
    expect(screen.getByText('1', { selector: 'span.font-mono' })).toBeInTheDocument();

    fireEvent.click(backspaceButton!);
    expect(screen.getByText('0', { selector: 'span.font-mono' })).toBeInTheDocument();
  });

  it('clears all digits with the Clear (X) button', () => {
    render(<KeypadWrapper initialAmount="9999" />);
    const clearButton = screen.getByTitle('Borrar todo');
    fireEvent.click(clearButton);
    expect(screen.getByText('0', { selector: 'span.font-mono' })).toBeInTheDocument();
  });

  it('toggles the optional note field when note button is clicked', () => {
    render(<KeypadWrapper />);
    const noteButton = screen.getByTitle('Añadir nota opcional');

    // Note input is initially closed
    expect(screen.queryByPlaceholderText(/Nota opcional/i)).not.toBeInTheDocument();

    // Click to open
    fireEvent.click(noteButton);
    expect(screen.getByPlaceholderText(/Nota opcional/i)).toBeInTheDocument();

    // Click to close
    fireEvent.click(noteButton);
    expect(screen.queryByPlaceholderText(/Nota opcional/i)).not.toBeInTheDocument();
  });
});
